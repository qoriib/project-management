use super::schema::{SyncManifest, MASTER_TABLES, PROJECT_TABLES};
use super::utils::get_db_path;
use crate::constants::SYNC_ARCHIVE_KEY;
use rusqlite::{params, Connection};
use std::fs::File;
use std::io::Read;
use zip::ZipArchive;

#[tauri::command]
pub fn import_csv_zip(app: tauri::AppHandle, source_path: String) -> Result<(), String> {
    let db_path = get_db_path(&app)?;
    let file = File::open(&source_path).map_err(|e| format!("Gagal membuka file backup: {e}"))?;
    let mut archive = ZipArchive::new(file).map_err(|e| format!("Format file backup tidak valid: {e}"))?;

    // 1. Baca manifest untuk mendapatkan project_id yang diimpor
    let manifest_content = match archive.by_name_decrypt("manifest.json", SYNC_ARCHIVE_KEY.as_bytes()) {
        Ok(mut zip_entry) => {
            let mut content = String::new();
            zip_entry
                .read_to_string(&mut content)
                .map_err(|e| format!("Gagal membaca manifest: {e}"))?;
            Some(content)
        }
        Err(_) => None,
    };

    let project_id = if let Some(content) = manifest_content {
        let manifest: SyncManifest = serde_json::from_str(&content)
            .map_err(|e| format!("Manifest berkas arsip rusak: {e}"))?;
        manifest.project_id
    } else {
        // Fallback: baca baris pertama dari projects.csv
        let mut zip_entry = archive
            .by_name_decrypt("projects.csv", SYNC_ARCHIVE_KEY.as_bytes())
            .map_err(|_| "File backup tidak valid: data proyek tidak ditemukan.".to_string())?;
        let mut rdr = csv::Reader::from_reader(&mut zip_entry);
        let headers = rdr.headers().map_err(|e| e.to_string())?.clone();
        let pid_idx = headers
            .iter()
            .position(|h| h == "project_id")
            .ok_or_else(|| "Kolom project_id tidak ditemukan di projects.csv".to_string())?;
        let mut records = rdr.records();
        let first_rec = records
            .next()
            .ok_or_else(|| "Data proyek kosong dalam berkas backup.".to_string())?
            .map_err(|e| e.to_string())?;
        first_rec
            .get(pid_idx)
            .filter(|id| !id.is_empty())
            .ok_or_else(|| "ID proyek kosong dalam berkas backup.".to_string())?
            .to_string()
    };

    let mut conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    // Matikan foreign key checks & triggers sementara selama transaksi impor agar batch aman dari konflik urutan
    conn.execute_batch("PRAGMA foreign_keys = OFF;")
        .map_err(|e| format!("Gagal menonaktifkan foreign keys: {e}"))?;

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // 2. Bersihkan data proyek lama untuk project_id terkait (Clean wipe khusus proyek ini)
    tx.execute(
        "DELETE FROM receipt_items WHERE receipt_id IN (
            SELECT receipt_id FROM receipts WHERE order_id IN (
                SELECT order_id FROM orders WHERE project_id = ?1
            )
        )",
        params![&project_id],
    )
    .map_err(|e| format!("Gagal membersihkan data receipt_items lama: {e}"))?;

    tx.execute(
        "DELETE FROM receipts WHERE order_id IN (
            SELECT order_id FROM orders WHERE project_id = ?1
        )",
        params![&project_id],
    )
    .map_err(|e| format!("Gagal membersihkan data receipts lama: {e}"))?;

    tx.execute(
        "DELETE FROM order_items WHERE order_id IN (
            SELECT order_id FROM orders WHERE project_id = ?1
        )",
        params![&project_id],
    )
    .map_err(|e| format!("Gagal membersihkan data order_items lama: {e}"))?;

    tx.execute(
        "DELETE FROM orders WHERE project_id = ?1",
        params![&project_id],
    )
    .map_err(|e| format!("Gagal membersihkan data orders lama: {e}"))?;

    tx.execute(
        "DELETE FROM requirements WHERE project_id = ?1",
        params![&project_id],
    )
    .map_err(|e| format!("Gagal membersihkan data requirements lama: {e}"))?;

    tx.execute(
        "DELETE FROM projects WHERE project_id = ?1",
        params![&project_id],
    )
    .map_err(|e| format!("Gagal membersihkan data project lama: {e}"))?;

    // 3. Impor & merge data Master (menggunakan INSERT OR REPLACE agar aman & idempotent)
    for &(table, _pk, _update_cols) in MASTER_TABLES {
        let zip_entry = match archive.by_name_decrypt(&format!("{table}.csv"), SYNC_ARCHIVE_KEY.as_bytes()) {
            Ok(entry) => entry,
            Err(_) => continue,
        };

        let mut rdr = csv::Reader::from_reader(zip_entry);
        let headers = rdr.headers().map_err(|e| e.to_string())?.clone();
        let col_count = headers.len();
        if col_count == 0 {
            continue;
        }

        let col_names = headers.iter().map(|h| format!("`{h}`")).collect::<Vec<_>>().join(", ");
        let placeholders = vec!["?"; col_count].join(", ");
        let insert_sql = format!("INSERT OR REPLACE INTO `{table}` ({col_names}) VALUES ({placeholders})");

        let mut stmt = tx.prepare(&insert_sql).map_err(|e| format!("Gagal prepare SQL master {table}: {e}"))?;

        for record in rdr.records() {
            let rec = record.map_err(|e| format!("Gagal membaca CSV master {table}: {e}"))?;
            let params: Vec<Option<String>> = rec
                .iter()
                .map(|f| if f.is_empty() { None } else { Some(f.to_string()) })
                .collect();

            stmt.execute(rusqlite::params_from_iter(params))
                .map_err(|e| format!("Gagal sinkronisasi tabel master {table}: {e}"))?;
        }
    }

    // 4. Impor tabel Proyek & Transaksi (menggunakan INSERT OR REPLACE)
    for &table in PROJECT_TABLES {
        let zip_entry = match archive.by_name_decrypt(&format!("{table}.csv"), SYNC_ARCHIVE_KEY.as_bytes()) {
            Ok(entry) => entry,
            Err(_) => continue,
        };

        let mut rdr = csv::Reader::from_reader(zip_entry);
        let headers = rdr.headers().map_err(|e| e.to_string())?.clone();
        let col_count = headers.len();
        if col_count == 0 {
            continue;
        }

        let col_names = headers.iter().map(|h| format!("`{h}`")).collect::<Vec<_>>().join(", ");
        let placeholders = vec!["?"; col_count].join(", ");
        let insert_sql = format!("INSERT OR REPLACE INTO `{table}` ({col_names}) VALUES ({placeholders})");

        let mut stmt = tx.prepare(&insert_sql).map_err(|e| format!("Gagal prepare SQL proyek {table}: {e}"))?;

        for record in rdr.records() {
            let rec = record.map_err(|e| format!("Gagal membaca CSV proyek {table}: {e}"))?;
            let params: Vec<Option<String>> = rec
                .iter()
                .map(|f| if f.is_empty() { None } else { Some(f.to_string()) })
                .collect();

            stmt.execute(rusqlite::params_from_iter(params))
                .map_err(|e| format!("Gagal mengimpor baris pada tabel {table}: {e}"))?;
        }
    }

    tx.commit().map_err(|e| format!("Gagal menyimpan perubahan database: {e}"))?;

    // Aktifkan kembali foreign keys setelah transaksi selesai
    let _ = conn.execute_batch("PRAGMA foreign_keys = ON;");

    Ok(())
}
