use std::{
    env,
    io::{self, Write},
    sync::Mutex,
};
use log;

use rusqlite::Connection;

pub struct AppConfigData {
    pub ini_path: Mutex<String>,
    pub db_path: Mutex<String>,
    pub connection: Mutex<Option<Connection>>,
}

impl AppConfigData {
    pub fn new() -> Self {
        Self {
            ini_path: Mutex::new("test.ini".to_string()),
            db_path: Mutex::new("test.db".to_string()),
            connection: Mutex::new(None),
        }
    }

    pub fn load_ini(&self) -> Result<bool, String> {
        log::info!("load_ini");

        let ini_path = self.ini_path.lock().unwrap();
        let mut config = configparser::ini::Ini::new();
        //print!("ini_path: {}\n", &*ini_path);

        let current_dir = env::current_dir().map_err(|e| e.to_string())?;
        println!("Current directory: {}\n", current_dir.display());

        // flush the print buffer to ensure the message is printed immediately
        io::stdout().flush().expect("Unable to flush stdout");

        config.load(&*ini_path).unwrap();
        let db_path = config.get("PATH", "db");
        match db_path{
            Some(path) => {
                println!("db_path: {}", path);
                log::info!("db_path: {}", path);
                *self.db_path.lock().unwrap() = path.clone();
            }
            None => {
                println!("db_path not found in ini file");
                log::error!("db_path not found in ini file");
            }
        }
        
        Ok(true)
    }
}
