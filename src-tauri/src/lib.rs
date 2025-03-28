
mod commands;
mod model;
mod database;
mod test;




#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![commands::init_database, commands::save_epi, commands::get_epi_materiel])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
