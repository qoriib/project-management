use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct SyncManifest {
    pub version: u32,
    pub project_id: String,
    pub project_name: String,
    pub exported_at: String,
    pub app_version: String,
}

pub use crate::constants::{MASTER_TABLES, PROJECT_TABLES};

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
