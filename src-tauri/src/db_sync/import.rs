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
                .map_err(|e| format!("Gagal membaca manifest (kemungkinan password/kunci salah): {e}"))?;
            Some(content)
        }
        Err(_) => None,
    };

    let project_id = if let Some(content) = manifest_content {
        let manifest: SyncManifest = serde_json::from_str(&content)
            .map_err(|e| format!("Manifest rusak: {e}"))?;
        manifest.project_id
    } else {
        // Fallback: baca baris pertama dari projects.csv
        let mut zip_entry = archive
            .by_name_decrypt("projects.csv", SYNC_ARCHIVE_KEY.as_bytes())
            .map_err(|_| "File backup tidak valid: data proyek tidak ditemukan atau terenkripsi dengan kunci berbeda.".to_string())?;
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
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // 2. Bersihkan data proyek lama untuk project_id terkait
    // Ubah requirements_is_approved = 0 terlebih dahulu agar tidak terblokir trigger SQLite (prevent_requirement_delete)
    let _ = tx.execute(
        "UPDATE projects SET requirements_is_approved = 0 WHERE project_id = ?1",
        params![&project_id],
    );

    // Hapus data yang berelasi dengan urutan child -> parent
    tx.execute(
        "DELETE FROM receipt_items WHERE receipt_id IN (
            SELECT receipt_id FROM receipts WHERE order_id IN (
                SELECT order_id FROM orders WHERE project_id = ?1
            )
        )",
        params![&project_id],
    )
    .map_err(|e| format!("Gagal membersihkan data receipt_items: {e}"))?;

    tx.execute(
        "DELETE FROM receipts WHERE order_id IN (
            SELECT order_id FROM orders WHERE project_id = ?1
        )",
        params![&project_id],
    )
    .map_err(|e| format!("Gagal membersihkan data receipts: {e}"))?;

    tx.execute(
        "DELETE FROM order_items WHERE order_id IN (
            SELECT order_id FROM orders WHERE project_id = ?1
        )",
        params![&project_id],
    )
    .map_err(|e| format!("Gagal membersihkan data order_items: {e}"))?;

    tx.execute(
        "DELETE FROM orders WHERE project_id = ?1",
        params![&project_id],
    )
    .map_err(|e| format!("Gagal membersihkan data orders: {e}"))?;

    tx.execute(
        "DELETE FROM requirements WHERE project_id = ?1",
        params![&project_id],
    )
    .map_err(|e| format!("Gagal membersihkan data requirements: {e}"))?;

    tx.execute(
        "DELETE FROM projects WHERE project_id = ?1",
        params![&project_id],
    )
    .map_err(|e| format!("Gagal membersihkan data projects: {e}"))?;

    // 3. Impor & merge data Master (merge berdasarkan updated_at terbaru jika ada konflik)
    for &(table, pk, update_cols) in MASTER_TABLES {
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

        let temp_table = format!("temp_{table}");
        tx.execute_batch(&format!(
            "DROP TABLE IF EXISTS {temp_table}; \
             CREATE TEMP TABLE {temp_table} AS SELECT * FROM {table} WHERE 0;"
        ))
        .map_err(|e| e.to_string())?;

        let placeholders = vec!["?"; col_count].join(",");
        let insert_sql = format!("INSERT INTO {temp_table} VALUES ({placeholders})");
        {
            let mut stmt = tx.prepare(&insert_sql).map_err(|e| e.to_string())?;
            for record in rdr.records() {
                let rec = record.map_err(|e| e.to_string())?;
                let params: Vec<Option<&str>> = rec
                    .iter()
                    .map(|f| if f.is_empty() { None } else { Some(f) })
                    .collect();
                stmt.execute(rusqlite::params_from_iter(params))
                    .map_err(|e| e.to_string())?;
            }
        }

        let upsert_sql = format!(
            "INSERT INTO {table} SELECT * FROM {temp_table} \
             ON CONFLICT({pk}) DO UPDATE SET \
             {update_cols}, updated_at = excluded.updated_at \
             WHERE excluded.updated_at > {table}.updated_at OR {table}.updated_at IS NULL; \
             DROP TABLE {temp_table};"
        );
        tx.execute_batch(&upsert_sql)
            .map_err(|e| format!("Gagal sinkronisasi tabel master {table}: {e}"))?;
    }

    // 4. Impor tabel Proyek (ditimpa secara bersih dengan data baru)
    let mut approved_status: Option<i64> = None;

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
        let insert_sql = format!("INSERT INTO `{table}` ({col_names}) VALUES ({placeholders})");

        let mut stmt = tx.prepare(&insert_sql).map_err(|e| e.to_string())?;

        let approved_col_idx = if table == "projects" {
            headers.iter().position(|h| h == "requirements_is_approved")
        } else {
            None
        };

        for record in rdr.records() {
            let rec = record.map_err(|e| e.to_string())?;
            let mut params: Vec<Option<String>> = rec
                .iter()
                .map(|f| if f.is_empty() { None } else { Some(f.to_string()) })
                .collect();

            // Jika sedang memasukkan projects, set requirements_is_approved = "0" terlebih dahulu
            if let Some(idx) = approved_col_idx {
                if let Some(val) = params.get(idx).and_then(|v| v.as_deref()) {
                    approved_status = val.parse::<i64>().ok();
                }
                params[idx] = Some("0".to_string());
            }

            stmt.execute(rusqlite::params_from_iter(params))
                .map_err(|e| format!("Gagal mengimpor baris pada tabel {table}: {e}"))?;
        }
    }

    // 5. Kembalikan status requirements_is_approved asli pada proyek jika ada
    if let Some(status) = approved_status {
        tx.execute(
            "UPDATE projects SET requirements_is_approved = ?1 WHERE project_id = ?2",
            params![status, &project_id],
        )
        .map_err(|e| format!("Gagal memulihkan status persetujuan proyek: {e}"))?;
    }

    tx.commit().map_err(|e| format!("Gagal menyimpan perubahan database: {e}"))?;
    app.restart();
}
