use super::schema::{get_project_export_query, SyncManifest, MASTER_TABLES, PROJECT_TABLES};
use super::utils::get_db_path;
use crate::constants::SYNC_ARCHIVE_KEY;
use rusqlite::types::ValueRef;
use rusqlite::{params, Connection};
use std::fs::File;
use zip::write::FileOptions;
use zip::{AesMode, CompressionMethod, ZipWriter};

#[tauri::command]
pub fn export_csv_zip(
    app: tauri::AppHandle,
    target_path: String,
    project_id: String,
) -> Result<(), String> {
    let db_path = get_db_path(&app)?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    // Pastikan proyek ada dan ambil namanya untuk metadata
    let project_name: String = conn
        .query_row(
            "SELECT project_name FROM projects WHERE project_id = ?1",
            params![&project_id],
            |row| row.get(0),
        )
        .map_err(|_| format!("Proyek dengan ID '{project_id}' tidak ditemukan."))?;

    let file = File::create(&target_path).map_err(|e| e.to_string())?;
    let mut zip = ZipWriter::new(file);
    let options = FileOptions::<'_, ()>::default()
        .compression_method(CompressionMethod::Deflated)
        .with_aes_encryption(AesMode::Aes256, SYNC_ARCHIVE_KEY);

    // 1. Tulis manifest.json ke arsip terenkripsi
    let manifest = SyncManifest {
        version: 1,
        project_id: project_id.clone(),
        project_name,
        exported_at: chrono::Local::now().to_rfc3339(),
        app_version: env!("CARGO_PKG_VERSION").to_string(),
    };
    zip.start_file("manifest.json", options)
        .map_err(|e| e.to_string())?;
    let manifest_bytes = serde_json::to_vec_pretty(&manifest).map_err(|e| e.to_string())?;
    std::io::Write::write_all(&mut zip, &manifest_bytes).map_err(|e| e.to_string())?;

    // 2. Ekspor seluruh isi tabel master
    for &(table, _, _) in MASTER_TABLES {
        export_table_to_zip(&conn, &mut zip, options, table, &format!("SELECT * FROM {table}"))?;
    }

    // 3. Ekspor tabel per project yang terkait
    for &table in PROJECT_TABLES {
        let query = get_project_export_query(table, &project_id);
        export_table_to_zip(&conn, &mut zip, options, table, &query)?;
    }

    zip.finish().map_err(|e| e.to_string())?;
    Ok(())
}

fn export_table_to_zip<W: std::io::Write + std::io::Seek>(
    conn: &Connection,
    zip: &mut ZipWriter<W>,
    options: FileOptions<'_, ()>,
    table: &str,
    query: &str,
) -> Result<(), String> {
    zip.start_file(format!("{table}.csv"), options)
        .map_err(|e| e.to_string())?;
    let mut wtr = csv::Writer::from_writer(zip);

    let mut stmt = conn.prepare(query).map_err(|e| e.to_string())?;
    let col_count = stmt.column_count();

    let cols: Vec<String> = stmt.column_names().into_iter().map(String::from).collect();
    wtr.write_record(&cols).map_err(|e| e.to_string())?;

    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let mut record = Vec::with_capacity(col_count);
        for i in 0..col_count {
            let val_str = match row.get_ref(i).map_err(|e| e.to_string())? {
                ValueRef::Null => String::new(),
                ValueRef::Integer(v) => v.to_string(),
                ValueRef::Real(v) => v.to_string(),
                ValueRef::Text(v) => String::from_utf8_lossy(v).into_owned(),
                ValueRef::Blob(_) => String::new(),
            };
            record.push(val_str);
        }
        wtr.write_record(&record).map_err(|e| e.to_string())?;
    }
    wtr.flush().map_err(|e| e.to_string())?;
    Ok(())
}
