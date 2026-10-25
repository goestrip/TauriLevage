mod commands;
mod database;
mod model;
mod state;
#[cfg(test)]
mod test;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
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
        .plugin(tauri_plugin_opener::init())
        .manage(state::AppConfigData::new())
        .invoke_handler(tauri::generate_handler![
            commands::has_database,
            commands::init_database,
            commands::set_db_path,
            commands::save_epi,
            commands::get_epi,
            commands::get_epi_materiel,
            commands::delete_epi,
            commands::add_epi_materiel,
            commands::delete_epi_materiel,
            commands::save_levage,
            commands::get_levage,
            commands::get_levage_materiel,
            commands::delete_levage,
            commands::add_levage_materiel,
            commands::delete_levage_materiel,
            commands::get_people,
            commands::add_person,
            commands::delete_person,
            commands::get_emplacement,
            commands::add_emplacement,
            commands::delete_emplacement,
            commands::get_anomaly_types,
            commands::add_anomaly_type,
            commands::delete_anomaly_type,
            commands::save_anomaly,
            commands::get_anomalies,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
