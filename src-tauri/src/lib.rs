use sqlite::Connection;

mod commands;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello {}! You've been greeted from Rust!", name)
}

//open a sqlite db
fn open_db()-> Connection {
    let connection = sqlite::open("test.db").unwrap();
    let query = "
        CREATE TABLE IF NOT EXISTS users (name TEXT, age INTEGER);
        INSERT INTO users VALUES ('Alice', 42);
        INSERT INTO users VALUES ('Bob', 69);
    ";
    connection.execute(query).unwrap();
    return connection
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, commands::load_user])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
