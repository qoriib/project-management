use crate::constants::APP_GENERAL_KEY;
use rusqlite::types::ValueRef;
use std::fs::File;
use std::io::Read;
use tauri::Manager;
use zip::write::FileOptions;
use zip::{CompressionMethod, ZipArchive, ZipWriter};

const TABLES: &[(&str, &str, &str)] = &[
    ("projects", "project_id", "project_name = excluded.project_name, company_name = excluded.company_name, fiscal_year = excluded.fiscal_year, deleted_at = excluded.deleted_at"),
    ("vendors", "vendor_id", "vendor_name = excluded.vendor_name, phone = excluded.phone, address = excluded.address, deleted_at = excluded.deleted_at"),
    ("item_categories", "category_id", "category_name = excluded.category_name, deleted_at = excluded.deleted_at"),
    ("units", "unit_id", "unit_name = excluded.unit_name, deleted_at = excluded.deleted_at"),
    ("items", "item_id", "item_name = excluded.item_name, category_id = excluded.category_id, unit_id = excluded.unit_id, deleted_at = excluded.deleted_at"),
    ("item_prices", "item_price_id", "item_id = excluded.item_id, price = excluded.price, deleted_at = excluded.deleted_at"),
    ("bom_groups", "bom_group_id", "project_id = excluded.project_id, group_name = excluded.group_name, deleted_at = excluded.deleted_at"),
    ("bill_of_materials", "bom_id", "project_id = excluded.project_id, bom_group_id = excluded.bom_group_id, item_id = excluded.item_id, item_price_id = excluded.item_price_id, qty = excluded.qty, deleted_at = excluded.deleted_at"),
    ("purchase_orders", "po_id", "project_id = excluded.project_id, po_date = excluded.po_date, deleted_at = excluded.deleted_at"),
    ("po_items", "po_item_id", "po_id = excluded.po_id, item_id = excluded.item_id, vendor_id = excluded.vendor_id, item_price_id = excluded.item_price_id, qty = excluded.qty"),
    ("deliveries", "delivery_id", "po_id = excluded.po_id, delivery_date = excluded.delivery_date, deleted_at = excluded.deleted_at"),
    ("delivery_items", "delivery_item_id", "delivery_id = excluded.delivery_id, po_item_id = excluded.po_item_id, qty = excluded.qty"),
];

fn get_db_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let mut db_path = app.path().app_local_data_dir().map_err(|e| e.to_string())?;
    db_path.push("proyek.db");

    if !db_path.exists() {
        let mut alt_path = app.path().app_data_dir().map_err(|e| e.to_string())?;
        alt_path.push("proyek.db");
        if alt_path.exists() {
            db_path = alt_path;
        } else {
            let mut alt_path2 = app.path().app_config_dir().map_err(|e| e.to_string())?;
            alt_path2.push("proyek.db");
            if alt_path2.exists() {
                db_path = alt_path2;
            }
        }
    }
    Ok(db_path)
}

// Fixed internal password for encryption, stored as bytes to slightly obfuscate it in the binary.

#[tauri::command]
pub fn reset_db(app: tauri::AppHandle) -> Result<(), String> {
    let db_path = get_db_path(&app)?;

    if db_path.exists() {
        std::fs::remove_file(&db_path).map_err(|e| e.to_string())?;
    }

    // Also try to remove WAL and SHM files to completely reset
    let mut wal_path = db_path.clone();
    wal_path.set_extension("db-wal");
    if wal_path.exists() {
        let _ = std::fs::remove_file(wal_path);
    }

    let mut shm_path = db_path.clone();
    shm_path.set_extension("db-shm");
    if shm_path.exists() {
        let _ = std::fs::remove_file(shm_path);
    }

    app.restart();
}

#[tauri::command]
pub fn export_csv_zip(
    app: tauri::AppHandle,
    target_path: String,
    project_id: Option<String>,
) -> Result<(), String> {
    let db_path = get_db_path(&app)?;
    if !db_path.exists() {
        return Err("Database utama tidak ditemukan!".into());
    }

    let conn = rusqlite::Connection::open(&db_path).map_err(|e| e.to_string())?;

    let file = File::create(&target_path).map_err(|e| e.to_string())?;
    let mut zip = ZipWriter::new(file);

    let pass_str = std::str::from_utf8(APP_GENERAL_KEY).unwrap();
    let options: FileOptions<'_, ()> = FileOptions::default()
        .compression_method(CompressionMethod::Deflated)
        .with_aes_encryption(zip::AesMode::Aes256, pass_str);

    for &(table, _, _) in TABLES {
        zip.start_file(format!("{}.csv", table), options)
            .map_err(|e| e.to_string())?;

        let mut wtr = csv::Writer::from_writer(&mut zip);

        let query = match table {
            "projects" if project_id.is_some() => format!("SELECT * FROM projects WHERE project_id = '{}'", project_id.as_ref().unwrap()),
            "bom_groups" if project_id.is_some() => format!("SELECT * FROM bom_groups WHERE project_id = '{}'", project_id.as_ref().unwrap()),
            "bill_of_materials" if project_id.is_some() => format!("SELECT * FROM bill_of_materials WHERE project_id = '{}'", project_id.as_ref().unwrap()),
            "purchase_orders" if project_id.is_some() => format!("SELECT * FROM purchase_orders WHERE project_id = '{}'", project_id.as_ref().unwrap()),
            "po_items" if project_id.is_some() => format!("SELECT * FROM po_items WHERE po_id IN (SELECT po_id FROM purchase_orders WHERE project_id = '{}')", project_id.as_ref().unwrap()),
            "deliveries" if project_id.is_some() => format!("SELECT * FROM deliveries WHERE po_id IN (SELECT po_id FROM purchase_orders WHERE project_id = '{}')", project_id.as_ref().unwrap()),
            "delivery_items" if project_id.is_some() => format!("SELECT * FROM delivery_items WHERE delivery_id IN (SELECT delivery_id FROM deliveries WHERE po_id IN (SELECT po_id FROM purchase_orders WHERE project_id = '{}'))", project_id.as_ref().unwrap()),
            _ => format!("SELECT * FROM {}", table),
        };

        let mut stmt = conn
            .prepare(&query)
            .map_err(|e| format!("Error querying table {}: {}", table, e))?;

        let cols: Vec<String> = stmt.column_names().iter().map(|s| s.to_string()).collect();
        wtr.write_record(&cols).map_err(|e| e.to_string())?;

        let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
        while let Some(row) = rows.next().map_err(|e| e.to_string())? {
            let mut record = Vec::new();
            for i in 0..cols.len() {
                let val = row.get_ref(i).map_err(|e| e.to_string())?;
                let s = match val {
                    ValueRef::Null => "".to_string(),
                    ValueRef::Integer(i) => i.to_string(),
                    ValueRef::Real(f) => f.to_string(),
                    ValueRef::Text(t) => String::from_utf8_lossy(t).to_string(),
                    ValueRef::Blob(_) => "".to_string(),
                };
                record.push(s);
            }
            wtr.write_record(&record).map_err(|e| e.to_string())?;
        }
        wtr.flush().map_err(|e| e.to_string())?;
    }

    zip.finish().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn import_csv_zip(app: tauri::AppHandle, source_path: String) -> Result<(), String> {
    let db_path = get_db_path(&app)?;

    let file = File::open(&source_path).map_err(|e| e.to_string())?;
    let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;

    let mut temp_path = std::env::temp_dir();
    temp_path.push("proyek_merge.db");
    if db_path.exists() {
        std::fs::copy(&db_path, &temp_path).map_err(|e| e.to_string())?;
    }

    let mut conn = rusqlite::Connection::open(&temp_path).map_err(|e| e.to_string())?;

    for &(table, pk, update_cols) in TABLES {
        let file_name = format!("{}.csv", table);
        let pass_str = std::str::from_utf8(APP_GENERAL_KEY).unwrap();

        let zip_file_result = archive.by_name_decrypt(&file_name, pass_str.as_bytes()).ok();

        let mut zip_file = match zip_file_result {
            Some(f) => f,
            None => continue,
        };

        let mut csv_data = String::new();
        zip_file
            .read_to_string(&mut csv_data)
            .map_err(|e| e.to_string())?;

        // Parse CSV
        let mut rdr = csv::Reader::from_reader(csv_data.as_bytes());
        let headers = rdr.headers().map_err(|e| e.to_string())?.clone();

        // Create temp table with same structure
        let temp_table = format!("temp_{}", table);
        conn.execute(&format!("DROP TABLE IF EXISTS {}", temp_table), [])
            .map_err(|e| e.to_string())?;
        conn.execute(
            &format!(
                "CREATE TEMP TABLE {} AS SELECT * FROM {} WHERE 0",
                temp_table, table
            ),
            [],
        )
        .map_err(|e| e.to_string())?;

        // Insert into temp table
        let placeholders = vec!["?"; headers.len()].join(", ");
        let insert_temp = format!("INSERT INTO {} VALUES ({})", temp_table, placeholders);

        let tx = conn.transaction().map_err(|e| e.to_string())?;
        {
            let mut stmt = tx.prepare(&insert_temp).map_err(|e| e.to_string())?;
            for result in rdr.records() {
                let record = result.map_err(|e| e.to_string())?;
                let mut params: Vec<&dyn rusqlite::ToSql> = Vec::new();
                let mut string_vals = Vec::new();
                for field in record.iter() {
                    string_vals.push(if field.is_empty() {
                        None
                    } else {
                        Some(field.to_string())
                    });
                }
                for val in &string_vals {
                    params.push(val);
                }
                stmt.execute(rusqlite::params_from_iter(params))
                    .map_err(|e| e.to_string())?;
            }
        }
        tx.commit().map_err(|e| e.to_string())?;

        // Upsert into main table from temp table
        let upsert_sql = format!(
            "INSERT INTO {table} SELECT * FROM {temp_table} \
             ON CONFLICT({pk}) DO UPDATE SET \
             {update_cols}, updated_at = excluded.updated_at \
             WHERE excluded.updated_at > {table}.updated_at"
        );
        conn.execute(&upsert_sql, [])
            .map_err(|e| format!("Gagal sinkronisasi tabel {}: {}", table, e))?;
    }

    drop(conn);

    std::fs::copy(&temp_path, &db_path).map_err(|e| e.to_string())?;
    let _ = std::fs::remove_file(temp_path);

    app.restart();
}
