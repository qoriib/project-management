use crate::constants::DB_NAME;
use rusqlite::types::ValueRef;
use rusqlite::Connection;
use std::fs::File;
use std::path::PathBuf;
use tauri::Manager;
use zip::write::FileOptions;
use zip::{CompressionMethod, ZipArchive, ZipWriter};

const TABLES: &[(&str, &str, &str)] = &[
    ("projects", "project_id", "project_name = excluded.project_name, company_name = excluded.company_name, fiscal_year = excluded.fiscal_year, deleted_at = excluded.deleted_at"),
    ("vendors", "vendor_id", "vendor_name = excluded.vendor_name, phone = excluded.phone, address = excluded.address, deleted_at = excluded.deleted_at"),
    ("item_categories", "category_id", "prefix = excluded.prefix, category_code = excluded.category_code, category_name = excluded.category_name, deleted_at = excluded.deleted_at"),
    ("units", "unit_id", "unit_name = excluded.unit_name, deleted_at = excluded.deleted_at"),
    ("items", "item_id", "item_code = excluded.item_code, item_name = excluded.item_name, category_id = excluded.category_id, unit_id = excluded.unit_id, deleted_at = excluded.deleted_at"),
    ("item_prices", "item_price_id", "item_id = excluded.item_id, price = excluded.price, deleted_at = excluded.deleted_at"),
    ("bom_groups", "bom_group_id", "project_id = excluded.project_id, group_name = excluded.group_name, deleted_at = excluded.deleted_at"),
    ("bill_of_materials", "bom_id", "project_id = excluded.project_id, bom_group_id = excluded.bom_group_id, item_id = excluded.item_id, item_price_id = excluded.item_price_id, qty = excluded.qty, deleted_at = excluded.deleted_at"),
    ("purchase_orders", "po_id", "project_id = excluded.project_id, po_date = excluded.po_date, deleted_at = excluded.deleted_at"),
    ("po_items", "po_item_id", "po_id = excluded.po_id, item_id = excluded.item_id, vendor_id = excluded.vendor_id, item_price_id = excluded.item_price_id, qty = excluded.qty"),
    ("deliveries", "delivery_id", "po_id = excluded.po_id, delivery_date = excluded.delivery_date, deleted_at = excluded.deleted_at"),
    ("delivery_items", "delivery_item_id", "delivery_id = excluded.delivery_id, po_item_id = excluded.po_item_id, qty = excluded.qty"),
];

fn get_db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let candidates = [
        app.path().app_local_data_dir(),
        app.path().app_data_dir(),
        app.path().app_config_dir(),
    ];

    for dir in candidates.into_iter().flatten() {
        let path = dir.join(DB_NAME);
        if path.exists() {
            return Ok(path);
        }
    }

    app.path()
        .app_local_data_dir()
        .map(|p| p.join(DB_NAME))
        .map_err(|e| e.to_string())
}

fn get_export_query(table: &str, project_id: Option<&str>) -> String {
    let Some(pid) = project_id else {
        return format!("SELECT * FROM {table}");
    };

    match table {
        "projects" | "bom_groups" | "bill_of_materials" | "purchase_orders" => {
            format!("SELECT * FROM {table} WHERE project_id = '{pid}'")
        }
        "po_items" | "deliveries" => {
            format!("SELECT * FROM {table} WHERE po_id IN (SELECT po_id FROM purchase_orders WHERE project_id = '{pid}')")
        }
        "delivery_items" => {
            format!("SELECT * FROM delivery_items WHERE delivery_id IN (SELECT delivery_id FROM deliveries WHERE po_id IN (SELECT po_id FROM purchase_orders WHERE project_id = '{pid}'))")
        }
        _ => format!("SELECT * FROM {table}"),
    }
}

#[tauri::command]
pub fn reset_db(app: tauri::AppHandle) -> Result<(), String> {
    let db_path = get_db_path(&app)?;
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
        let _ = std::fs::remove_file(db_path.with_extension("db-wal"));
        let _ = std::fs::remove_file(db_path.with_extension("db-shm"));
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
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    let file = File::create(&target_path).map_err(|e| e.to_string())?;
    let mut zip = ZipWriter::new(file);
    let options = FileOptions::<'_, ()>::default().compression_method(CompressionMethod::Deflated);

    for &(table, _, _) in TABLES {
        zip.start_file(format!("{table}.csv"), options)
            .map_err(|e| e.to_string())?;
        let mut wtr = csv::Writer::from_writer(&mut zip);

        let query = get_export_query(table, project_id.as_deref());
        let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
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
    }

    zip.finish().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn import_csv_zip(app: tauri::AppHandle, source_path: String) -> Result<(), String> {
    let db_path = get_db_path(&app)?;
    let mut archive = ZipArchive::new(File::open(&source_path).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;

    let mut conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    for &(table, pk, update_cols) in TABLES {
        let Ok(file) = archive.by_name(&format!("{table}.csv")) else {
            continue;
        };

        let mut rdr = csv::Reader::from_reader(file);
        let headers = rdr.headers().map_err(|e| e.to_string())?;
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
             WHERE excluded.updated_at > {table}.updated_at; \
             DROP TABLE {temp_table};"
        );
        tx.execute_batch(&upsert_sql)
            .map_err(|e| format!("Gagal sinkronisasi tabel {table}: {e}"))?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    app.restart();
}
