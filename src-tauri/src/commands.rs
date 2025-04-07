use std::io::{self, Write};
use tauri::State;

use crate::{database, model::Epi, model::Anomaly, state::AppConfigData};

#[tauri::command]
pub fn has_database(state: State<AppConfigData>) -> Result<bool, String> {
    state.load_ini().map_err(|e| e.to_string())?;
    let db_path = state.db_path.lock().unwrap().clone();

    if db_path.is_empty() {
        return Ok(false);
    }
    if std::path::Path::new(&db_path).exists() {
        Ok(true)
    } else {
        Ok(false)
    }
}

#[tauri::command]
pub fn init_database(state: State<AppConfigData>) -> Result<String, String> {
    state.load_ini().map_err(|e| e.to_string())?;
    let db_path = state.db_path.lock().unwrap().clone();

    let connection = database::open_db(&db_path).map_err(|e| e.to_string())?;
    database::init_db(&connection).map_err(|e| e.to_string())?;
    *state.connection.lock().unwrap() = Some(connection);

    log::info!("Database initialized at {}", db_path);
    Ok("Database initialized".to_string())
}

#[tauri::command]
pub fn set_db_path(state: State<AppConfigData>, db_path: String) -> Result<String, String> {
    log::info!("setting Database path to {}", db_path);
    state.set_db_path(db_path.clone()).map_err(|e| e.to_string())?;
    Ok(db_path)
}

#[tauri::command]
pub fn save_epi(state: State<AppConfigData>, epi: String) -> String {
    log::info!("save_epi {}", epi);
    let epi_parsed: Epi = serde_json::from_str(&epi).unwrap();

    let connection = state.connection.lock().unwrap();
    if connection.is_none() {
        eprintln!("Database connection is None");
        return "Database connection is None".to_string();
    }
    let saved = database::save_epi(&connection, &epi_parsed);
    match saved {
        Ok(_) => {
            println!("Epi saved");
            io::stdout().flush().expect("Unable to flush stdout");
        }
        Err(e) => eprintln!("Error saving epi: {}", e),
    }

    serde_json::to_string(&epi_parsed).unwrap()
}

#[tauri::command]
pub fn get_epi_materiel(state: State<AppConfigData>) -> Result<String, String> {
    let connection = state.connection.lock().unwrap();
    if connection.is_none() {
        return Err("No Database connection ".to_string());
    }

    let epi_materiel = database::get_all_epi_materiel(&connection).map_err(|e| e.to_string())?;

    Ok(serde_json::to_string(&epi_materiel).unwrap())
}

#[tauri::command]
pub fn get_epi(state: State<AppConfigData>) -> Result<String, String> {
    log::info!("get_epi");
    let connection = state.connection.lock().unwrap();
    if connection.is_none() {
        log::error!("No Database connection in state");
        return Err("No Database connection ".to_string());
    }
    let epi = database::get_all_epi(&connection).map_err(|e| e.to_string())?;

    Ok(serde_json::to_string(&epi).unwrap())
}

#[tauri::command]
pub fn get_people(state: State<AppConfigData>) -> Result<String, String> {
    log::info!("get_people");
    let connection = state.connection.lock().unwrap();
    if connection.is_none() {
        log::error!("No Database connection in state");
        return Err("No Database connection ".to_string());
    }
    let people = database::get_all_people(&connection).map_err(|e| e.to_string())?;

    Ok(serde_json::to_string(&people).unwrap())
}
#[tauri::command]
pub fn get_emplacement(state: State<AppConfigData>) -> Result<String, String> {
    log::info!("get_emplacement");
    let connection = state.connection.lock().unwrap();
    if connection.is_none() {
        log::error!("No Database connection in state");
        return Err("No Database connection ".to_string());
    }
    let emplacement = database::get_all_emplacement(&connection).map_err(|e| e.to_string())?;

    Ok(serde_json::to_string(&emplacement).unwrap())
}
#[tauri::command]
pub fn get_anomaly_types(state: State<AppConfigData>) -> Result<String, String> {
    log::info!("get_anomaly_types");
    let connection = state.connection.lock().unwrap();
    if connection.is_none() {
        log::error!("No Database connection in state");
        return Err("No Database connection ".to_string());
    }
    let anomaly_types = database::get_anomaly_types(&connection).map_err(|e| e.to_string())?;

    Ok(serde_json::to_string(&anomaly_types).unwrap())
}
#[tauri::command]
pub fn save_anomaly(state: State<AppConfigData>,anomaly: String,) -> Result<String, String> {
    log::info!("save_anomaly {}", anomaly);
    let anomaly_parsed: Anomaly = serde_json::from_str(&anomaly).unwrap();

    let connection = state.connection.lock().unwrap();
    if connection.is_none() {
        log::error!("Database connection is None");
        return Err("Database connection is None".to_string());
    }
    let saved = database::save_anomaly(&connection, &anomaly_parsed);
    let mut inserted_id: i32 = 0;
    match saved {
        Ok(id) => {
            log::info!("Anomaly saved with id {}", id);
            inserted_id = id;
        }
        Err(e) => log::error!("Error saving anomaly: {}", e),
    }

    Ok(inserted_id.to_string())
}
#[tauri::command]
pub fn get_anomalies(state: State<AppConfigData>) -> Result<String, String> {
    log::info!("get_anomalies");
    let connection = state.connection.lock().unwrap();
    if connection.is_none() {
        log::error!("No Database connection in state");
        return Err("No Database connection ".to_string());
    }
    let anomalies = database::get_all_anomalies(&connection).map_err(|e| e.to_string())?;

    Ok(serde_json::to_string(&anomalies).unwrap())
}

