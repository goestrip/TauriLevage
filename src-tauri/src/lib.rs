
mod commands;
mod model;
mod database;



#[tauri::command]
fn init_database() -> Result<String, String> {
    let connection = database::open_db().map_err(|e| e.to_string())?;
    database::init_db(&connection).map_err(|e| e.to_string())?;
    Ok("Database initialized".to_string())
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![init_database])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
