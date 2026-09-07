use crate::constants::{AUTH_FILE_NAME, DEFAULT_PIN, PIN_LENGTH};
use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::Manager;

static IS_AUTHENTICATED: AtomicBool = AtomicBool::new(false);

fn get_auth_file_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let mut path = app.path().app_local_data_dir().map_err(|e| e.to_string())?;
    path.push(AUTH_FILE_NAME);
    Ok(path)
}

fn get_stored_pin(app: &tauri::AppHandle) -> Result<String, String> {
    let path = get_auth_file_path(app)?;

    if !path.exists() {
        return Ok(DEFAULT_PIN.to_string());
    }

    match fs::read_to_string(&path) {
        Ok(pin) => Ok(pin.trim().to_string()),
        Err(_) => Ok(DEFAULT_PIN.to_string()),
    }
}

#[tauri::command]
pub fn check_pin(app: tauri::AppHandle, pin: String) -> Result<bool, String> {
    let stored = get_stored_pin(&app)?;
    let is_valid = stored == pin;
    if is_valid {
        IS_AUTHENTICATED.store(true, Ordering::SeqCst);
    }
    Ok(is_valid)
}

#[tauri::command]
pub fn get_auth_status() -> Result<bool, String> {
    Ok(IS_AUTHENTICATED.load(Ordering::SeqCst))
}

#[tauri::command]
pub fn logout() -> Result<bool, String> {
    IS_AUTHENTICATED.store(false, Ordering::SeqCst);
    Ok(true)
}

#[tauri::command]
pub fn change_pin(app: tauri::AppHandle, new_pin: String) -> Result<bool, String> {
    if new_pin.len() != PIN_LENGTH || !new_pin.chars().all(char::is_numeric) {
        return Err(format!("PIN baru harus terdiri dari {PIN_LENGTH} angka."));
    }

    let path = get_auth_file_path(&app)?;
    fs::write(path, new_pin).map_err(|e| e.to_string())?;

    Ok(true)
}
