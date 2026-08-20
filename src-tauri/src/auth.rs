use std::fs;
use std::path::PathBuf;
use tauri::Manager;

const DEFAULT_PIN: &str = "000000";

fn get_auth_file_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let mut path = app.path().app_local_data_dir().map_err(|e| e.to_string())?;
    path.push("auth.bin");
    Ok(path)
}

fn get_stored_pin(app: &tauri::AppHandle) -> Result<String, String> {
    let path = get_auth_file_path(app)?;
    
    if !path.exists() {
        return Ok(DEFAULT_PIN.to_string());
    }
    
    match fs::read_to_string(&path) {
        Ok(pin) => Ok(pin.trim().to_string()),
        Err(_) => Ok(DEFAULT_PIN.to_string())
    }
}

#[tauri::command]
pub fn check_pin(app: tauri::AppHandle, pin: String) -> Result<bool, String> {
    let stored = get_stored_pin(&app)?;
    Ok(stored == pin)
}

#[tauri::command]
pub fn change_pin(app: tauri::AppHandle, new_pin: String) -> Result<bool, String> {
    if new_pin.len() != 6 || !new_pin.chars().all(char::is_numeric) {
        return Err("PIN baru harus terdiri dari 6 angka.".into());
    }
    
    let path = get_auth_file_path(&app)?;
    fs::write(path, new_pin).map_err(|e| e.to_string())?;
    
    Ok(true)
}
