use rusqlite::{named_params, Connection, Result};

use crate::model::{self, Epi, EpiMateriel, People};

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


    connection.execute(
        "CREATE TABLE IF NOT EXISTS anomaly_type (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL
        )",
        [],
    )?;
    // Create table for anomalies
    connection.execute(
        "CREATE TABLE IF NOT EXISTS anomalies (
            id INTEGER PRIMARY KEY,
            anomaly_type_id INTEGER NOT NULL,
            description TEXT NOT NULL,
            criticity INTEGER NOT NULL,
            date_detection INTEGER NOT NULL,
            date_resolution INTEGER,
            FOREIGN KEY(anomaly_type_id) REFERENCES anomaly_type(id)
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
            date_mise_en_service INTEGER NULL,
            date_fabrication INTEGER NULL,
            validite_years INTEGER NULL,
            assigned_to_id INTEGER,
            emplacement_id INTEGER,
            date_last_control INTEGER,
            date_rebus INTEGER,
            anomaly_id INTEGER,
            FOREIGN KEY(anomaly_id) REFERENCES anomalies(id),
            FOREIGN KEY(nature_id) REFERENCES epi_materiel(id),
            FOREIGN KEY(assigned_to_id) REFERENCES people(id),
            FOREIGN KEY(emplacement_id) REFERENCES emplacement(id)
        );
        CREATE UNIQUE INDEX idx_serial ON epi (serial);
        ",
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

pub fn get_all_people(connection: &Option<Connection>) -> Result<Vec<People>> {
    let connection = match connection {
        Some(conn) => conn,
        None => {
            return Err(rusqlite::Error::InvalidParameterName(
                "No database connection".to_string(),
            ))
        }
    };

    let mut stmt = connection.prepare("SELECT id, prenom, nom FROM people")?;
    let people_iter = stmt.query_map([], |row| {
        Ok(People {
            id: row.get(0)?,
            prenom: row.get(1)?,
            nom: row.get(2)?,
        })
    })?;
    Ok(people_iter.collect::<Result<Vec<crate::model::People>>>()?)
}

pub fn get_all_emplacement(connection: &Option<Connection>) -> Result<Vec<crate::model::Emplacement>> {
    let connection = match connection {
        Some(conn) => conn,
        None => {
            return Err(rusqlite::Error::InvalidParameterName(
                "No database connection".to_string(),
            ))
        }
    };

    let mut stmt = connection.prepare("SELECT id, location FROM emplacement")?;
    let emplacement_iter = stmt.query_map([], |row| {
        Ok(crate::model::Emplacement {
            id: row.get(0)?,
            location: row.get(1)?,
        })
    })?;
    Ok(emplacement_iter.collect::<Result<Vec<crate::model::Emplacement>>>()?)
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
                assigned_to_id = :assigned_to_id,
                emplacement_id = :emplacement_id,
                date_last_control = :date_last_control,
                date_rebus = :date_rebus,
                anomaly_id = :anomaly_id
             WHERE id = :id",
            named_params! {
                ":id": id,
                ":nature_id": epi.nature_id,
                ":serial": epi.serial,
                ":date_mise_en_service": epi.date_mise_en_service,
                ":date_fabrication": epi.date_fabrication,
                ":validite_years": epi.validite_years,
                ":assigned_to_id": epi.assigned_to_id,
                ":emplacement_id": epi.emplacement_id,
                ":date_last_control": epi.date_last_control,
                ":date_rebus": epi.date_rebus,
                ":anomaly_id": epi.anomaly_id
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
                assigned_to_id ,
                date_last_control, 
                emplacement_id, 
                date_rebus,
                anomaly_id
            ) VALUES (
                :nature_id, 
                :serial, 
                :date_mise_en_service, 
                :date_fabrication, 
                :validite_years, 
                :assigned_to_id,
                :date_last_control, 
                :emplacement_id,
                :date_rebus,
                :anomaly_id
            )",
            named_params! {
                ":nature_id": epi.nature_id,
                ":serial": epi.serial,
                ":date_mise_en_service": epi.date_mise_en_service,
                ":date_fabrication": epi.date_fabrication,
                ":validite_years": epi.validite_years,
                ":date_last_control": epi.date_last_control,
                ":date_rebus": epi.date_rebus,
                ":assigned_to_id": epi.assigned_to_id,
                ":emplacement_id": epi.emplacement_id,
                ":anomaly_id": epi.anomaly_id
            },
        )?;
    }

    Ok(())
}

pub fn get_anomaly_types(connection: &Option<Connection>) -> Result<Vec<crate::model::AnomalyType>> {
    let connection = match connection {
        Some(conn) => conn,
        None => {
            return Err(rusqlite::Error::InvalidParameterName(
                "No database connection".to_string(),
            ))
        }
    };

    let mut stmt = connection.prepare("SELECT id, name FROM anomaly_type")?;
    let anomaly_type_iter = stmt.query_map([], |row| {
        Ok(crate::model::AnomalyType {
            id: row.get(0)?,
            name: row.get(1)?,
        })
    })?;
    Ok(anomaly_type_iter.collect::<Result<Vec<crate::model::AnomalyType>>>()?)
}

pub fn save_anomaly(connection: &Option<Connection>, anomaly: &model::Anomaly) -> Result<i32> {
    let connection = match connection {
        Some(conn) => conn,
        None => {
            return Err(rusqlite::Error::InvalidParameterName(
                "No database connection".to_string(),
            ))
        }
    };
    log::info!("save_anomaly {:?}", anomaly);

    if let Some(id) = anomaly.id {
        // Update existing record
        if let Err(e) =connection.execute(
            "UPDATE anomalies SET 
                anomaly_type_id = :anomaly_type_id, 
                description = :description, 
                criticity = :criticity, 
                date_detection = :date_detection, 
                date_resolution = :date_resolution
             WHERE id = :id",
            named_params! {
                ":id": id,
                ":anomaly_type_id": anomaly.anomaly_type_id,
                ":description": anomaly.description,
                ":criticity": anomaly.criticity,
                ":date_detection": anomaly.date_detection.to_string(),
                ":date_resolution": anomaly.date_resolution.unwrap_or_default()
            },
        ){
            log::error!("Failed to insert anomaly: {:?}", e);
            return Err(e);
        }
        Ok(id)
    } else {
        // Insert new record
        if let Err(e) = connection.execute(
            "INSERT INTO anomalies (
                anomaly_type_id, 
                description, 
                criticity, 
                date_detection, 
                date_resolution
            ) VALUES (
                :anomaly_type_id, 
                :description, 
                :criticity, 
                :date_detection, 
                :date_resolution
            )",
            named_params! {
                ":anomaly_type_id": anomaly.anomaly_type_id,
                ":description": anomaly.description,
                ":criticity": anomaly.criticity,
                ":date_detection": anomaly.date_detection.to_string(),
                ":date_resolution": anomaly.date_resolution.unwrap_or_default()
            },
        ){
            log::error!("Failed to update anomaly: {:?}", e);
            return Err(e);
        };
        // Retrieve the last inserted ID
        let last_id = connection.last_insert_rowid();
        log::info!("Last inserted ID: {}", last_id);
        // Return the anomaly with the last inserted ID
        Ok(last_id as i32)
    }
}   

pub fn get_all_anomalies(connection: &Option<Connection>) -> Result<Vec<crate::model::Anomaly>> {
    let connection = match connection {
        Some(conn) => conn,
        None => {
            return Err(rusqlite::Error::InvalidParameterName(
                "No database connection".to_string(),
            ))
        }
    };

    let mut stmt = connection.prepare("SELECT * FROM anomalies")?;
    let anomaly_iter = stmt.query_map([], |row| {
        Ok(crate::model::Anomaly {
            id: Some(row.get(0)?),
            anomaly_type_id: row.get(1)?,
            description: row.get(2)?,
            criticity: row.get(3)?,
            date_detection: row.get(4)?,
            date_resolution: row.get(5)?,
        })
    })
    .map_err(|e| {
        log::error!("Error querying anomalies: {:?}", e);
        rusqlite::Error::QueryReturnedNoRows
    })?;
    
    Ok(anomaly_iter.collect::<Result<Vec<crate::model::Anomaly>>>()?)
}

pub fn delete_epi(connection: &Option<Connection>, id: i32) -> Result<()> {
    let connection = match connection {
        Some(conn) => conn,
        None => {
            return Err(rusqlite::Error::InvalidParameterName(
                "No database connection".to_string(),
            ))
        }
    };

    connection.execute("DELETE FROM epi WHERE id = ?", [id])?;
    Ok(())
}