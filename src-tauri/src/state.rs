use log;
use std::{env, fs, path::PathBuf, sync::Mutex};

use rusqlite::Connection;

pub struct AppConfigData {
    pub ini_path: Mutex<String>,
    pub db_path: Mutex<String>,
    pub connection: Mutex<Option<Connection>>,
}

impl AppConfigData {
    pub fn new() -> Self {
        let dir = writable_app_dir();
        let cwd_ini = env::current_dir()
            .ok()
            .map(|cwd| cwd.join("levage.ini"))
            .filter(|path| path.is_file());
        let ini = cwd_ini.unwrap_or_else(|| dir.join("levage.ini"));
        let db = dir.join("suivi.db");
        Self {
            ini_path: Mutex::new(ini.to_string_lossy().into_owned()),
            db_path: Mutex::new(db.to_string_lossy().into_owned()),
            connection: Mutex::new(None),
        }
    }

    /// Loads `levage.ini` when it exists. A missing file keeps the default
    /// database path and does not panic, including when the process was
    /// started from a directory that is not writable.
    pub fn load_ini(&self) -> Result<bool, String> {
        let ini_path = self
            .ini_path
            .lock()
            .map_err(|err| err.to_string())?
            .clone();
        log::info!("load_ini from {ini_path}");

        if !std::path::Path::new(&ini_path).is_file() {
            log::info!("ini file not found at {ini_path}, keeping default database path");
            return Ok(false);
        }

        let mut config = configparser::ini::Ini::new();
        config.load(&ini_path).map_err(|err| err.to_string())?;
        match config.get("PATH", "db") {
            Some(path) => {
                log::info!("db_path: {path}");
                *self.db_path.lock().map_err(|err| err.to_string())? = path;
            }
            None => {
                log::error!("db_path not found in ini file {ini_path}");
            }
        }

        Ok(true)
    }

    pub fn set_db_path(&self, db_path: String) -> Result<String, String> {
        let ini_path = self
            .ini_path
            .lock()
            .map_err(|err| err.to_string())?
            .clone();
        log::info!("Database path set to {db_path}, saving to {ini_path}");

        let mut config = configparser::ini::Ini::new();
        if std::path::Path::new(&ini_path).is_file() {
            config.load(&ini_path).map_err(|err| err.to_string())?;
        }
        config.set("PATH", "db", Some(db_path.clone()));

        if let Some(parent) = std::path::Path::new(&ini_path).parent() {
            if !parent.as_os_str().is_empty() {
                fs::create_dir_all(parent).map_err(|err| {
                    format!(
                        "Impossible de créer le dossier de configuration {}: {err}",
                        parent.display()
                    )
                })?;
            }
        }
        config.write(&ini_path).map_err(|err| {
            format!("Impossible d'écrire le fichier de configuration {ini_path}: {err}")
        })?;

        *self.db_path.lock().map_err(|err| err.to_string())? = db_path.clone();
        Ok(db_path)
    }
}

fn writable_app_dir() -> PathBuf {
    let mut bases = Vec::new();
    if let Some(xdg) = env::var_os("XDG_CONFIG_HOME") {
        bases.push(PathBuf::from(xdg));
    }
    if let Some(appdata) = env::var_os("APPDATA") {
        bases.push(PathBuf::from(appdata));
    }
    if let Some(home) = env::var_os("HOME") {
        bases.push(PathBuf::from(home).join(".config"));
    }
    if let Some(profile) = env::var_os("USERPROFILE") {
        bases.push(PathBuf::from(profile).join("AppData").join("Roaming"));
    }
    bases.push(env::temp_dir());

    for base in bases {
        let dir = base.join("suivi-materiel");
        if fs::create_dir_all(&dir).is_err() {
            continue;
        }
        let probe = dir.join(".write-probe");
        if fs::write(&probe, b"ok").is_ok() {
            let _ = fs::remove_file(&probe);
            return dir;
        }
    }

    env::temp_dir()
}
