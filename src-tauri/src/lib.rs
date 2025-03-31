mod commands;
mod database;
mod model;
mod state;
mod test;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .manage(state::AppConfigData::new())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Webview,
                ))
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("Logs".to_string()),
                    },
                ))
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            commands::has_database,
            commands::init_database,
            commands::set_db_path,
            commands::save_epi,
            commands::get_epi,
            commands::get_epi_materiel
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
