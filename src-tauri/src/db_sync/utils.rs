use crate::constants::DB_NAME;
use std::path::PathBuf;
use tauri::Manager;

pub fn get_db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
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
