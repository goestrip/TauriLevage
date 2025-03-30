use rusqlite::{named_params, Connection, Result};

use crate::model::{Epi, EpiMateriel};

//open a sqlite db
pub fn open_db(path: &str) -> Result<Connection> {
    let connection = Connection::open(path)?;
    return Ok(connection);
}

pub fn init_db(connection: &Connection) -> Result<()> {
    connection.execute(
        "CREATE TABLE IF NOT EXISTS people (
            id INTEGER PRIMARY KEY,
            prenom TEXT NOT NULL,
            nom TEXT NOT NULL
        )",
        [],
    )?;

    connection.execute(
        "CREATE TABLE IF NOT EXISTS emplacement (
            id INTEGER PRIMARY KEY,
            location TEXT NOT NULL
        )",
        [],
    )?;

    // Create table for anomalies
    connection.execute(
        "CREATE TABLE IF NOT EXISTS anomalies (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            criticity TEXT NOT NULL,
            is_handled BOOLEAN NOT NULL,
            date_detection TEXT NOT NULL,
            date_resolution TEXT
        )",
        [],
    )?;

    // Create table for epi_materiel
    connection.execute(
        "CREATE TABLE IF NOT EXISTS epi_materiel (
            id INTEGER PRIMARY KEY,
            nature TEXT NOT NULL            
        )",
        [],
    )?;

    // Create table for epi
    connection.execute(
        "CREATE TABLE IF NOT EXISTS epi (
            id INTEGER PRIMARY KEY,
            nature_id INTEGER NOT NULL,
            serial TEXT NOT NULL,
            date_mise_en_service INTEGER NOT NULL,
            date_fabrication INTEGER NOT NULL,
            validite_years INTEGER NOT NULL,
            assigned_to_id INTEGER,
            emplacement_id INTEGER,
            date_last_control INTEGER,
            date_rebus INTEGER,
            anomaly_id INTEGER,
            FOREIGN KEY(anomaly_id) REFERENCES anomalies(id),
            FOREIGN KEY(nature_id) REFERENCES epi_materiel(id),
            FOREIGN KEY(assigned_to_id) REFERENCES people(id),
            FOREIGN KEY(emplacement_id) REFERENCES emplacement(id)
        )",
        [],
    )?;

    Ok(())
}

pub fn get_all_epi_materiel(connection: &Option<Connection>) -> Result<Vec<EpiMateriel>> {
    let connection = match connection {
        Some(conn) => conn,
        None => {
            return Err(rusqlite::Error::InvalidParameterName(
                "No database connection".to_string(),
            ))
        }
    };

    let mut stmt = connection.prepare("SELECT id, nature FROM epi_materiel")?;
    let epi_materiel_iter = stmt.query_map([], |row| {
        Ok(EpiMateriel {
            id: row.get(0)?,
            nature: row.get(1)?,
        })
    })?;
    Ok(epi_materiel_iter.collect::<Result<Vec<EpiMateriel>>>()?)
}

pub fn get_all_epi(connection: &Option<Connection>) -> Result<Vec<Epi>> {
    let connection = match connection {
        Some(conn) => conn,
        None => {
            return Err(rusqlite::Error::InvalidParameterName(
                "No database connection".to_string(),
            ))
        }
    };

    let mut stmt = connection.prepare("SELECT * FROM epi")?;
    let epi_iter = stmt.query_map([], |row| {
        Ok(Epi {
            id: Some(row.get(0)?),
            nature_id: row.get(1)?,
            serial: row.get(2)?,
            date_mise_en_service: row.get(3)?,
            date_fabrication: row.get(4)?,
            validite_years: row.get(5)?,
            assigned_to_id: row.get(6)?,
            emplacement_id: row.get(7)?,
            date_last_control: row.get(8)?,
            date_rebus: row.get(9)?,
            anomaly_id: row.get(10)?,
        })
    })?;
    Ok(epi_iter.collect::<Result<Vec<Epi>>>()?)
}

pub fn save_epi(connection: &Option<Connection>, epi: &Epi) -> Result<()> {
    let connection = match connection {
        Some(conn) => conn,
        None => {
            return Err(rusqlite::Error::InvalidParameterName(
                "No database connection".to_string(),
            ))
        }
    };
    if let Some(id) = epi.id {
        // Update existing record
        connection.execute(
            "UPDATE epi SET 
                nature_id = :nature_id, 
                serial = :serial, 
                date_mise_en_service = :date_mise_en_service,
                date_fabrication = :date_fabrication, 
                validite_years = :validite_years ,
                date_last_control = :date_last_control,
                date_rebus = :date_rebus
             WHERE id = :id",
            named_params! {
                ":id": id,
                ":nature_id": epi.nature_id,
                ":serial": epi.serial,
                ":date_mise_en_service": epi.date_mise_en_service.to_string(),
                ":date_fabrication": epi.date_fabrication.to_string(),
                ":validite_years": epi.validite_years,
                // ":assigned_to_id": &epi.assigned_to_id.map(|p| p.id),
                // ":emplacement_id": epi.emplacement_id.map(|e| e.id),
                ":date_last_control": epi.date_last_control.unwrap_or_default(),
                ":date_rebus": epi.date_rebus.unwrap_or_default()
            },
        )?;
    } else {
        // Insert new record
        connection.execute(
            "INSERT INTO epi (
                nature_id, 
                serial, 
                date_mise_en_service, 
                date_fabrication, 
                validite_years, 
                date_last_control, 
                date_rebus
            ) VALUES (
                :nature_id, 
                :serial, 
                :date_mise_en_service, 
                :date_fabrication, 
                :validite_years, 
                :date_last_control, 
                :date_rebus
            )",
            named_params! {
                ":nature_id": epi.nature_id,
                ":serial": epi.serial,
                ":date_mise_en_service": epi.date_mise_en_service.to_string(),
                ":date_fabrication": epi.date_fabrication.to_string(),
                ":validite_years": epi.validite_years,
                ":date_last_control": epi.date_last_control.unwrap_or_default(),
                ":date_rebus": epi.date_rebus.unwrap_or_default()
            },
        )?;
    }

    Ok(())
}
