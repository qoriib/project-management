// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod auth;
mod constants;
mod db_sync;

use constants::DB_SQLITE_URL;
use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use tauri_plugin_log::{Target, TargetKind};

    // Log level: Debug in dev builds, Info in release builds
    #[cfg(debug_assertions)]
    let log_level = log::LevelFilter::Debug;
    #[cfg(not(debug_assertions))]
    let log_level = log::LevelFilter::Info;

    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log_level)
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir {
                        file_name: Some("project-management".into()),
                    }),
                ])
                .max_file_size(10_000_000) // 10 MB
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|_app| Ok(()))
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(
                    DB_SQLITE_URL,
                    vec![
                        Migration {
                            version: 1,
                            description: "init_schema",
                            sql: include_str!("../migrations/001_init.sql"),
                            kind: MigrationKind::Up,
                        },
                    ],
                )
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            db_sync::reset_db,
            db_sync::export_csv_zip,
            db_sync::import_csv_zip,
            auth::check_pin,
            auth::change_pin
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
