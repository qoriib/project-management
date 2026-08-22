use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct SyncManifest {
    pub version: u32,
    pub project_id: String,
    pub project_name: String,
    pub exported_at: String,
    pub app_version: String,
}

// Master tables: Synchronized globally, merged by updated_at on conflict
pub const MASTER_TABLES: &[(&str, &str, &str)] = &[
    (
        "vendors",
        "vendor_id",
        "vendor_name = excluded.vendor_name, phone = excluded.phone, address = excluded.address, deleted_at = excluded.deleted_at",
    ),
    (
        "item_categories",
        "category_id",
        "prefix = excluded.prefix, category_code = excluded.category_code, category_name = excluded.category_name, deleted_at = excluded.deleted_at",
    ),
    (
        "units",
        "unit_id",
        "unit_name = excluded.unit_name, deleted_at = excluded.deleted_at",
    ),
    (
        "items",
        "item_id",
        "item_code = excluded.item_code, item_name = excluded.item_name, category_id = excluded.category_id, unit_id = excluded.unit_id, deleted_at = excluded.deleted_at",
    ),
    (
        "item_prices",
        "item_price_id",
        "item_id = excluded.item_id, price = excluded.price, deleted_at = excluded.deleted_at",
    ),
];

// Project-scoped tables: Scoped to the selected project_id
pub const PROJECT_TABLES: &[&str] = &[
    "projects",
    "requirements",
    "orders",
    "order_items",
    "receipts",
    "receipt_items",
];

pub fn get_project_export_query(table: &str, project_id: &str) -> String {
    match table {
        "projects" | "requirements" | "orders" => {
            format!("SELECT * FROM {table} WHERE project_id = '{project_id}'")
        }
        "order_items" => {
            format!(
                "SELECT * FROM order_items WHERE order_id IN (SELECT order_id FROM orders WHERE project_id = '{project_id}')"
            )
        }
        "receipts" => {
            format!(
                "SELECT * FROM receipts WHERE order_id IN (SELECT order_id FROM orders WHERE project_id = '{project_id}')"
            )
        }
        "receipt_items" => {
            format!(
                "SELECT * FROM receipt_items WHERE receipt_id IN (SELECT receipt_id FROM receipts WHERE order_id IN (SELECT order_id FROM orders WHERE project_id = '{project_id}'))"
            )
        }
        _ => format!("SELECT * FROM {table}"),
    }
}
