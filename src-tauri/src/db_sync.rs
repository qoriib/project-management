use std::fs::File;
use std::io::Read;
use tauri::Manager;
use zip::write::FileOptions;
use zip::{CompressionMethod, ZipArchive, ZipWriter};
use sqlx::{Row, Column, TypeInfo};
use sqlx::sqlite::SqlitePoolOptions;
use sqlx::ValueRef;

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
    // tauri-plugin-sql default path
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

#[tauri::command]
pub fn reset_db(app: tauri::AppHandle) -> Result<(), String> {
    let db_path = get_db_path(&app)?;

    if db_path.exists() {
        std::fs::remove_file(&db_path).map_err(|e| e.to_string())?;
    }

    let wal = db_path.with_extension("db-wal");
    let shm = db_path.with_extension("db-shm");
    if wal.exists() { let _ = std::fs::remove_file(wal); }
    if shm.exists() { let _ = std::fs::remove_file(shm); }

    app.restart();
}

#[tauri::command]
pub async fn export_csv_zip(
    app: tauri::AppHandle,
    target_path: String,
    project_id: Option<String>,
) -> Result<(), String> {
    let db_path = get_db_path(&app)?;
    if !db_path.exists() {
        return Err("Database utama tidak ditemukan!".into());
    }

    let uri = format!("sqlite:{}", db_path.to_string_lossy());
    let pool = SqlitePoolOptions::new()
        .connect(&uri)
        .await
        .map_err(|e| e.to_string())?;

    let file = File::create(&target_path).map_err(|e| e.to_string())?;
    let mut zip = ZipWriter::new(file);

    let options: FileOptions<'_, ()> = FileOptions::default()
        .compression_method(CompressionMethod::Deflated);

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

        let rows = sqlx::query(&query).fetch_all(&pool).await.map_err(|e| e.to_string())?;

        if !rows.is_empty() {
            let cols: Vec<String> = rows[0].columns().iter().map(|c| c.name().to_string()).collect();
            wtr.write_record(&cols).map_err(|e| e.to_string())?;

            for row in rows {
                let mut record = Vec::new();
                for i in 0..cols.len() {
                    let val_ref = row.try_get_raw(i).map_err(|e| e.to_string())?;
                    let s = if val_ref.is_null() {
                        "".to_string()
                    } else {
                        let type_info = val_ref.type_info();
                        match type_info.name() {
                            "INTEGER" | "INT" | "NUMERIC" => row.try_get::<i64, _>(i).map(|v| v.to_string()).unwrap_or_default(),
                            "REAL" | "FLOAT" | "DOUBLE" => row.try_get::<f64, _>(i).map(|v| v.to_string()).unwrap_or_default(),
                            "TEXT" | "VARCHAR" => row.try_get::<String, _>(i).unwrap_or_default(),
                            "BOOLEAN" => row.try_get::<bool, _>(i).map(|v| if v { "1".to_string() } else { "0".to_string() }).unwrap_or_default(),
                            _ => row.try_get::<String, _>(i).unwrap_or_default(),
                        }
                    };
                    record.push(s);
                }
                wtr.write_record(&record).map_err(|e| e.to_string())?;
            }
        }
        wtr.flush().map_err(|e| e.to_string())?;
    }

    zip.finish().map_err(|e| e.to_string())?;
    pool.close().await;

    Ok(())
}

#[tauri::command]
pub async fn import_csv_zip(app: tauri::AppHandle, source_path: String) -> Result<(), String> {
    let db_path = get_db_path(&app)?;

    let file = File::open(&source_path).map_err(|e| e.to_string())?;
    let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;

    let mut temp_path = std::env::temp_dir();
    temp_path.push("proyek_merge.db");
    if db_path.exists() {
        std::fs::copy(&db_path, &temp_path).map_err(|e| e.to_string())?;
    }

    let uri = format!("sqlite:{}", temp_path.to_string_lossy());
    let pool = SqlitePoolOptions::new()
        .connect(&uri)
        .await
        .map_err(|e| e.to_string())?;

    for &(table, pk, update_cols) in TABLES {
        let file_name = format!("{}.csv", table);

        let mut csv_data = String::new();
        {
            let zip_file_result = archive.by_name(&file_name).ok();
            if let Some(mut zip_file) = zip_file_result {
                zip_file
                    .read_to_string(&mut csv_data)
                    .map_err(|e| e.to_string())?;
            } else {
                continue;
            }
        }

        let mut rdr = csv::Reader::from_reader(csv_data.as_bytes());
        let headers = rdr.headers().map_err(|e| e.to_string())?.clone();

        let temp_table = format!("temp_{}", table);
        sqlx::query(&format!("DROP TABLE IF EXISTS {}", temp_table))
            .execute(&pool).await.map_err(|e| e.to_string())?;
            
        sqlx::query(&format!("CREATE TEMP TABLE {} AS SELECT * FROM {} WHERE 0", temp_table, table))
            .execute(&pool).await.map_err(|e| e.to_string())?;

        let placeholders = vec!["?"; headers.len()].join(", ");
        let insert_temp = format!("INSERT INTO {} VALUES ({})", temp_table, placeholders);

        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
        
        for result in rdr.records() {
            let record = result.map_err(|e| e.to_string())?;
            
            let mut q = sqlx::query(&insert_temp);
            for field in record.iter() {
                if field.is_empty() {
                    q = q.bind(None::<String>);
                } else {
                    q = q.bind(field.to_string());
                }
            }
            q.execute(&mut *tx).await.map_err(|e| e.to_string())?;
        }
        tx.commit().await.map_err(|e| e.to_string())?;

        let upsert_sql = format!(
            "INSERT INTO {table} SELECT * FROM {temp_table} \
             ON CONFLICT({pk}) DO UPDATE SET \
             {update_cols}, updated_at = excluded.updated_at \
             WHERE excluded.updated_at > {table}.updated_at"
        );
        sqlx::query(&upsert_sql).execute(&pool).await
            .map_err(|e| format!("Gagal sinkronisasi tabel {}: {}", table, e))?;
    }

    pool.close().await;

    std::fs::copy(&temp_path, &db_path).map_err(|e| e.to_string())?;
    let _ = std::fs::remove_file(temp_path);

    app.restart();
}
