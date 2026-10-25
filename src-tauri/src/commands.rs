use rusqlite::Connection;
use tauri::State;

use crate::{
    database,
    model::{Anomaly, Epi, Levage},
    state::AppConfigData,
};

fn with_connection<T>(
    state: &AppConfigData,
    action: impl FnOnce(&Connection) -> Result<T, String>,
) -> Result<T, String> {
    let guard = state.connection.lock().map_err(|err| err.to_string())?;
    let connection = guard
        .as_ref()
        .ok_or_else(|| "No Database connection".to_string())?;
    action(connection)
}

fn to_json<T: serde::Serialize>(value: &T) -> Result<String, String> {
    serde_json::to_string(value).map_err(|err| err.to_string())
}

#[tauri::command]
pub fn has_database(state: State<AppConfigData>) -> Result<bool, String> {
    state.load_ini()?;
    let db_path = state.db_path.lock().map_err(|err| err.to_string())?.clone();
    if db_path.is_empty() {
        return Ok(false);
    }
    Ok(std::path::Path::new(&db_path).exists())
}

#[tauri::command]
pub fn init_database(state: State<AppConfigData>) -> Result<String, String> {
    state.load_ini()?;
    let db_path = state.db_path.lock().map_err(|err| err.to_string())?.clone();
    if db_path.trim().is_empty() {
        return Err("Chemin de base de données vide".to_string());
    }
    if let Some(parent) = std::path::Path::new(&db_path).parent() {
        if !parent.as_os_str().is_empty() {
            std::fs::create_dir_all(parent).map_err(|err| {
                format!(
                    "Impossible de créer le dossier de la base {}: {err}",
                    parent.display()
                )
            })?;
        }
    }

    let connection = database::open_db(&db_path)?;
    database::init_db(&connection)?;
    *state.connection.lock().map_err(|err| err.to_string())? = Some(connection);
    log::info!("Database initialized at {db_path}");
    Ok("Database initialized".to_string())
}

#[tauri::command]
pub fn set_db_path(state: State<AppConfigData>, db_path: String) -> Result<String, String> {
    log::info!("setting Database path to {db_path}");
    state.set_db_path(db_path)
}

#[tauri::command]
pub fn save_epi(state: State<AppConfigData>, epi: String) -> Result<i32, String> {
    log::info!("save_epi {epi}");
    let epi_parsed: Epi = serde_json::from_str(&epi).map_err(|err| err.to_string())?;
    with_connection(state.inner(), |connection| {
        database::save_epi(connection, &epi_parsed)
    })
}

#[tauri::command]
pub fn get_epi_materiel(state: State<AppConfigData>) -> Result<String, String> {
    let materiel = with_connection(state.inner(), database::get_all_epi_materiel)?;
    to_json(&materiel)
}

#[tauri::command]
pub fn get_epi(state: State<AppConfigData>) -> Result<String, String> {
    let epis = with_connection(state.inner(), database::get_all_epi)?;
    to_json(&epis)
}

#[tauri::command]
pub fn delete_epi(state: State<AppConfigData>, id: i32) -> Result<(), String> {
    log::info!("delete_epi {id}");
    with_connection(state.inner(), |connection| database::delete_epi(connection, id))
}

#[tauri::command]
pub fn add_epi_materiel(state: State<AppConfigData>, nature: String) -> Result<i32, String> {
    with_connection(state.inner(), |connection| {
        database::add_epi_materiel(connection, &nature)
    })
}

#[tauri::command]
pub fn delete_epi_materiel(state: State<AppConfigData>, id: i32) -> Result<(), String> {
    with_connection(state.inner(), |connection| {
        database::delete_epi_materiel(connection, id)
    })
}

#[tauri::command]
pub fn save_levage(state: State<AppConfigData>, levage: String) -> Result<i32, String> {
    log::info!("save_levage {levage}");
    let levage_parsed: Levage = serde_json::from_str(&levage).map_err(|err| err.to_string())?;
    with_connection(state.inner(), |connection| {
        database::save_levage(connection, &levage_parsed)
    })
}

#[tauri::command]
pub fn get_levage_materiel(state: State<AppConfigData>) -> Result<String, String> {
    let materiel = with_connection(state.inner(), database::get_all_levage_materiel)?;
    to_json(&materiel)
}

#[tauri::command]
pub fn get_levage(state: State<AppConfigData>) -> Result<String, String> {
    let levages = with_connection(state.inner(), database::get_all_levage)?;
    to_json(&levages)
}

#[tauri::command]
pub fn delete_levage(state: State<AppConfigData>, id: i32) -> Result<(), String> {
    log::info!("delete_levage {id}");
    with_connection(state.inner(), |connection| {
        database::delete_levage(connection, id)
    })
}

#[tauri::command]
pub fn add_levage_materiel(state: State<AppConfigData>, nature: String) -> Result<i32, String> {
    with_connection(state.inner(), |connection| {
        database::add_levage_materiel(connection, &nature)
    })
}

#[tauri::command]
pub fn delete_levage_materiel(state: State<AppConfigData>, id: i32) -> Result<(), String> {
    with_connection(state.inner(), |connection| {
        database::delete_levage_materiel(connection, id)
    })
}

#[tauri::command]
pub fn get_people(state: State<AppConfigData>) -> Result<String, String> {
    let people = with_connection(state.inner(), database::get_all_people)?;
    to_json(&people)
}

#[tauri::command]
pub fn add_person(
    state: State<AppConfigData>,
    prenom: String,
    nom: String,
) -> Result<i32, String> {
    with_connection(state.inner(), |connection| {
        database::add_person(connection, &prenom, &nom)
    })
}

#[tauri::command]
pub fn delete_person(state: State<AppConfigData>, id: i32) -> Result<(), String> {
    with_connection(state.inner(), |connection| {
        database::delete_person(connection, id)
    })
}

#[tauri::command]
pub fn get_emplacement(state: State<AppConfigData>) -> Result<String, String> {
    let emplacements = with_connection(state.inner(), database::get_all_emplacement)?;
    to_json(&emplacements)
}

#[tauri::command]
pub fn add_emplacement(state: State<AppConfigData>, location: String) -> Result<i32, String> {
    with_connection(state.inner(), |connection| {
        database::add_emplacement(connection, &location)
    })
}

#[tauri::command]
pub fn delete_emplacement(state: State<AppConfigData>, id: i32) -> Result<(), String> {
    with_connection(state.inner(), |connection| {
        database::delete_emplacement(connection, id)
    })
}

#[tauri::command]
pub fn get_anomaly_types(state: State<AppConfigData>) -> Result<String, String> {
    let types = with_connection(state.inner(), database::get_anomaly_types)?;
    to_json(&types)
}

#[tauri::command]
pub fn add_anomaly_type(state: State<AppConfigData>, name: String) -> Result<i32, String> {
    with_connection(state.inner(), |connection| {
        database::add_anomaly_type(connection, &name)
    })
}

#[tauri::command]
pub fn delete_anomaly_type(state: State<AppConfigData>, id: i32) -> Result<(), String> {
    with_connection(state.inner(), |connection| {
        database::delete_anomaly_type(connection, id)
    })
}

#[tauri::command]
pub fn save_anomaly(state: State<AppConfigData>, anomaly: String) -> Result<i32, String> {
    log::info!("save_anomaly {anomaly}");
    let anomaly_parsed: Anomaly = serde_json::from_str(&anomaly).map_err(|err| err.to_string())?;
    with_connection(state.inner(), |connection| {
        database::save_anomaly(connection, &anomaly_parsed)
    })
}

#[tauri::command]
pub fn get_anomalies(state: State<AppConfigData>) -> Result<String, String> {
    let anomalies = with_connection(state.inner(), database::get_all_anomalies)?;
    to_json(&anomalies)
}
