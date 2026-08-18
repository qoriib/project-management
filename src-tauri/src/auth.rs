use crate::constants::APP_GENERAL_KEY;
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce
};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;
use std::convert::TryFrom;

const DEFAULT_PIN: &str = "000000";

fn get_auth_file_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let mut path = app.path().app_local_data_dir().map_err(|e| e.to_string())?;
    path.push("auth.bin");
    Ok(path)
}

fn derive_key() -> [u8; 32] {
    let mut key = [0u8; 32];
    let len = std::cmp::min(APP_GENERAL_KEY.len(), 32);
    key[..len].copy_from_slice(&APP_GENERAL_KEY[..len]);
    key
}

fn get_stored_pin(app: &tauri::AppHandle) -> Result<String, String> {
    let path = get_auth_file_path(app)?;
    
    if !path.exists() {
        return Ok(DEFAULT_PIN.to_string());
    }
    
    let encrypted_data = fs::read(&path).map_err(|e| e.to_string())?;
    
    if encrypted_data.len() < 12 {
        return Ok(DEFAULT_PIN.to_string()); // Corrupted, fallback
    }
    
    let key = derive_key();
    let cipher = Aes256Gcm::new(&key.into());
    let (nonce_bytes, ciphertext) = encrypted_data.split_at(12);
    let nonce = Nonce::try_from(nonce_bytes).map_err(|e| e.to_string())?;
    
    match cipher.decrypt(&nonce, ciphertext) {
        Ok(decrypted) => {
            String::from_utf8(decrypted).map_err(|e| e.to_string())
        },
        Err(_) => Ok(DEFAULT_PIN.to_string()) // Decryption failed, assume default or corrupted
    }
}

#[tauri::command]
pub fn check_pin(app: tauri::AppHandle, pin: String) -> Result<bool, String> {
    let stored = get_stored_pin(&app)?;
    Ok(stored == pin)
}

#[tauri::command]
pub fn change_pin(app: tauri::AppHandle, old_pin: String, new_pin: String) -> Result<bool, String> {
    let stored = get_stored_pin(&app)?;
    
    if stored != old_pin {
        return Err("PIN lama tidak sesuai.".into());
    }
    
    if new_pin.len() != 6 || !new_pin.chars().all(char::is_numeric) {
        return Err("PIN baru harus terdiri dari 6 angka.".into());
    }
    
    let path = get_auth_file_path(&app)?;
    let key = derive_key();
    let cipher = Aes256Gcm::new(&key.into());
    
    let mut nonce_bytes = [0u8; 12];
    use rand::Rng;
    rand::rng().fill_bytes(&mut nonce_bytes);
    
    let nonce = Nonce::try_from(nonce_bytes.as_slice()).map_err(|e| e.to_string())?;
    
    let ciphertext = cipher.encrypt(&nonce, new_pin.as_bytes())
        .map_err(|e| e.to_string())?;
        
    let mut out_data = nonce_bytes.to_vec();
    out_data.extend_from_slice(&ciphertext);
    
    fs::write(path, out_data).map_err(|e| e.to_string())?;
    
    Ok(true)
}
