mod export;
mod import;
mod schema;
mod utils;

pub use export::*;
pub use import::*;

use utils::get_db_path;

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
