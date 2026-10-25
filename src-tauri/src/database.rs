use rusqlite::{named_params, Connection, Result as SqlResult};

use crate::model::{self, Anomaly, Epi, EpiMateriel, Levage, LevageMateriel, People};

pub type DbResult<T> = Result<T, String>;

fn sql<T>(result: SqlResult<T>) -> DbResult<T> {
    result.map_err(|err| err.to_string())
}

fn positive_id(id: Option<i32>) -> Option<i32> {
    match id {
        Some(value) if value > 0 => Some(value),
        _ => None,
    }
}

pub fn open_db(path: &str) -> DbResult<Connection> {
    let connection = sql(Connection::open(path))?;
    enable_foreign_keys(&connection)?;
    Ok(connection)
}

fn enable_foreign_keys(connection: &Connection) -> DbResult<()> {
    sql(connection.pragma_update(None, "foreign_keys", 1_i32))
}

pub fn init_db(connection: &Connection) -> DbResult<()> {
    enable_foreign_keys(connection)?;

    sql(connection.execute(
        "CREATE TABLE IF NOT EXISTS people (
            id INTEGER PRIMARY KEY,
            prenom TEXT NOT NULL,
            nom TEXT NOT NULL
        )",
        [],
    ))?;

    sql(connection.execute(
        "CREATE TABLE IF NOT EXISTS emplacement (
            id INTEGER PRIMARY KEY,
            location TEXT NOT NULL
        )",
        [],
    ))?;

    sql(connection.execute(
        "CREATE TABLE IF NOT EXISTS anomaly_type (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL
        )",
        [],
    ))?;

    sql(connection.execute(
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
    ))?;

    sql(connection.execute(
        "CREATE TABLE IF NOT EXISTS epi_materiel (
            id INTEGER PRIMARY KEY,
            nature TEXT NOT NULL
        )",
        [],
    ))?;

    sql(connection.execute(
        "CREATE TABLE IF NOT EXISTS levage_materiel (
            id INTEGER PRIMARY KEY,
            nature TEXT NOT NULL
        )",
        [],
    ))?;

    // rusqlite::Connection::execute runs a single statement. Indexes must be
    // created on their own, with a name that belongs to the right table.
    sql(connection.execute(
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
        )",
        [],
    ))?;

    sql(connection.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_epi_serial ON epi (serial)",
        [],
    ))?;

    sql(connection.execute(
        "CREATE TABLE IF NOT EXISTS levage (
            id INTEGER PRIMARY KEY,
            nature_id INTEGER NOT NULL,
            serial TEXT NOT NULL,
            date_mise_en_service INTEGER NULL,
            cmu_kg INTEGER NULL,
            longueur_m FLOAT NULL,
            essai_charge_kg INTEGER NULL,
            assigned_to_id INTEGER,
            emplacement_id INTEGER,
            date_last_control INTEGER,
            date_rebus INTEGER,
            anomaly_id INTEGER,
            FOREIGN KEY(anomaly_id) REFERENCES anomalies(id),
            FOREIGN KEY(nature_id) REFERENCES levage_materiel(id),
            FOREIGN KEY(assigned_to_id) REFERENCES people(id),
            FOREIGN KEY(emplacement_id) REFERENCES emplacement(id)
        )",
        [],
    ))?;

    sql(connection.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_levage_serial ON levage (serial)",
        [],
    ))?;

    // Older builds stored an unresolved anomaly as 0 instead of NULL.
    sql(connection.execute(
        "UPDATE anomalies SET date_resolution = NULL WHERE date_resolution = 0",
        [],
    ))?;

    seed_if_empty(connection)?;
    Ok(())
}

fn table_count(connection: &Connection, table: &str) -> DbResult<i64> {
    let sql_text = format!("SELECT COUNT(*) FROM {table}");
    sql(connection.query_row(&sql_text, [], |row| row.get(0)))
}

fn seed_if_empty(connection: &Connection) -> DbResult<()> {
    if table_count(connection, "epi_materiel")? == 0 {
        for nature in [
            "Harnais",
            "Longe",
            "Ancrage",
            "Casque",
            "Mousqueton",
            "Antichute",
            "Gants",
            "Chaussures de sécurité",
        ] {
            add_epi_materiel(connection, nature)?;
        }
    }

    if table_count(connection, "levage_materiel")? == 0 {
        for nature in [
            "Élingue",
            "Palan",
            "Crochet",
            "Manille",
            "Sangle",
            "Chaîne",
            "Palonnier",
            "Treuil",
        ] {
            add_levage_materiel(connection, nature)?;
        }
    }

    if table_count(connection, "anomaly_type")? == 0 {
        for name in [
            "Usure",
            "Rupture",
            "Corrosion",
            "Déformation",
            "Étiquette illisible",
            "Contrôle en retard",
        ] {
            add_anomaly_type(connection, name)?;
        }
    }

    if table_count(connection, "emplacement")? == 0 {
        for location in ["Atelier", "Chantier", "Magasin", "Véhicule"] {
            add_emplacement(connection, location)?;
        }
    }

    if table_count(connection, "people")? == 0 {
        for (prenom, nom) in [
            ("Paul", "Bertrand"),
            ("John", "Doe"),
            ("Jane", "Smith"),
            ("Alice", "Johnson"),
        ] {
            add_person(connection, prenom, nom)?;
        }
    }

    Ok(())
}

fn require_text(value: &str, label: &str) -> DbResult<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err(format!("{label} vide"));
    }
    Ok(trimmed.to_string())
}

pub fn add_epi_materiel(connection: &Connection, nature: &str) -> DbResult<i32> {
    let nature = require_text(nature, "Nature EPI")?;
    let exists: bool = sql(connection.query_row(
        "SELECT EXISTS(SELECT 1 FROM epi_materiel WHERE lower(nature) = lower(?1))",
        [&nature],
        |row| row.get(0),
    ))?;
    if exists {
        return Err(format!("La nature EPI « {nature} » existe déjà"));
    }
    sql(connection.execute("INSERT INTO epi_materiel (nature) VALUES (?1)", [&nature]))?;
    Ok(connection.last_insert_rowid() as i32)
}

pub fn add_levage_materiel(connection: &Connection, nature: &str) -> DbResult<i32> {
    let nature = require_text(nature, "Nature levage")?;
    let exists: bool = sql(connection.query_row(
        "SELECT EXISTS(SELECT 1 FROM levage_materiel WHERE lower(nature) = lower(?1))",
        [&nature],
        |row| row.get(0),
    ))?;
    if exists {
        return Err(format!("La nature de levage « {nature} » existe déjà"));
    }
    sql(connection.execute(
        "INSERT INTO levage_materiel (nature) VALUES (?1)",
        [&nature],
    ))?;
    Ok(connection.last_insert_rowid() as i32)
}

pub fn add_person(connection: &Connection, prenom: &str, nom: &str) -> DbResult<i32> {
    let nom = require_text(nom, "Nom")?;
    let prenom = prenom.trim().to_string();
    let exists: bool = sql(connection.query_row(
        "SELECT EXISTS(SELECT 1 FROM people WHERE lower(prenom) = lower(?1) AND lower(nom) = lower(?2))",
        [&prenom, &nom],
        |row| row.get(0),
    ))?;
    if exists {
        return Err(format!("La personne « {prenom} {nom} » existe déjà"));
    }
    sql(connection.execute(
        "INSERT INTO people (prenom, nom) VALUES (?1, ?2)",
        [&prenom, &nom],
    ))?;
    Ok(connection.last_insert_rowid() as i32)
}

pub fn add_emplacement(connection: &Connection, location: &str) -> DbResult<i32> {
    let location = require_text(location, "Emplacement")?;
    let exists: bool = sql(connection.query_row(
        "SELECT EXISTS(SELECT 1 FROM emplacement WHERE lower(location) = lower(?1))",
        [&location],
        |row| row.get(0),
    ))?;
    if exists {
        return Err(format!("L'emplacement « {location} » existe déjà"));
    }
    sql(connection.execute(
        "INSERT INTO emplacement (location) VALUES (?1)",
        [&location],
    ))?;
    Ok(connection.last_insert_rowid() as i32)
}

pub fn add_anomaly_type(connection: &Connection, name: &str) -> DbResult<i32> {
    let name = require_text(name, "Type d'anomalie")?;
    let exists: bool = sql(connection.query_row(
        "SELECT EXISTS(SELECT 1 FROM anomaly_type WHERE lower(name) = lower(?1))",
        [&name],
        |row| row.get(0),
    ))?;
    if exists {
        return Err(format!("Le type d'anomalie « {name} » existe déjà"));
    }
    sql(connection.execute(
        "INSERT INTO anomaly_type (name) VALUES (?1)",
        [&name],
    ))?;
    Ok(connection.last_insert_rowid() as i32)
}

fn delete_row(connection: &Connection, sql_text: &str, id: i32, label: &str) -> DbResult<()> {
    let changed = connection.execute(sql_text, [id]).map_err(|err| {
        let message = err.to_string();
        if message.to_lowercase().contains("foreign key") {
            format!("Suppression impossible : cet élément est encore utilisé ({message})")
        } else {
            message
        }
    })?;
    if changed == 0 {
        return Err(format!("{label} {id} introuvable"));
    }
    Ok(())
}

pub fn delete_epi_materiel(connection: &Connection, id: i32) -> DbResult<()> {
    delete_row(
        connection,
        "DELETE FROM epi_materiel WHERE id = ?1",
        id,
        "Nature EPI",
    )
}

pub fn delete_levage_materiel(connection: &Connection, id: i32) -> DbResult<()> {
    delete_row(
        connection,
        "DELETE FROM levage_materiel WHERE id = ?1",
        id,
        "Nature levage",
    )
}

pub fn delete_person(connection: &Connection, id: i32) -> DbResult<()> {
    delete_row(connection, "DELETE FROM people WHERE id = ?1", id, "Personne")
}

pub fn delete_emplacement(connection: &Connection, id: i32) -> DbResult<()> {
    delete_row(
        connection,
        "DELETE FROM emplacement WHERE id = ?1",
        id,
        "Emplacement",
    )
}

pub fn delete_anomaly_type(connection: &Connection, id: i32) -> DbResult<()> {
    delete_row(
        connection,
        "DELETE FROM anomaly_type WHERE id = ?1",
        id,
        "Type d'anomalie",
    )
}

pub fn get_all_epi_materiel(connection: &Connection) -> DbResult<Vec<EpiMateriel>> {
    let mut stmt = sql(connection.prepare(
        "SELECT id, nature FROM epi_materiel ORDER BY nature COLLATE NOCASE",
    ))?;
    let rows = sql(stmt.query_map([], |row| {
        Ok(EpiMateriel {
            id: row.get(0)?,
            nature: row.get(1)?,
        })
    }))?;
    sql(rows.collect::<SqlResult<Vec<_>>>())
}

pub fn get_all_levage_materiel(connection: &Connection) -> DbResult<Vec<LevageMateriel>> {
    let mut stmt = sql(connection.prepare(
        "SELECT id, nature FROM levage_materiel ORDER BY nature COLLATE NOCASE",
    ))?;
    let rows = sql(stmt.query_map([], |row| {
        Ok(LevageMateriel {
            id: row.get(0)?,
            nature: row.get(1)?,
        })
    }))?;
    sql(rows.collect::<SqlResult<Vec<_>>>())
}

pub fn get_all_people(connection: &Connection) -> DbResult<Vec<People>> {
    let mut stmt = sql(connection.prepare(
        "SELECT id, prenom, nom FROM people ORDER BY nom COLLATE NOCASE, prenom COLLATE NOCASE",
    ))?;
    let rows = sql(stmt.query_map([], |row| {
        Ok(People {
            id: row.get(0)?,
            prenom: row.get(1)?,
            nom: row.get(2)?,
        })
    }))?;
    sql(rows.collect::<SqlResult<Vec<_>>>())
}

pub fn get_all_emplacement(connection: &Connection) -> DbResult<Vec<model::Emplacement>> {
    let mut stmt = sql(connection.prepare(
        "SELECT id, location FROM emplacement ORDER BY location COLLATE NOCASE",
    ))?;
    let rows = sql(stmt.query_map([], |row| {
        Ok(model::Emplacement {
            id: row.get(0)?,
            location: row.get(1)?,
        })
    }))?;
    sql(rows.collect::<SqlResult<Vec<_>>>())
}

pub fn get_anomaly_types(connection: &Connection) -> DbResult<Vec<model::AnomalyType>> {
    let mut stmt = sql(connection.prepare(
        "SELECT id, name FROM anomaly_type ORDER BY name COLLATE NOCASE",
    ))?;
    let rows = sql(stmt.query_map([], |row| {
        Ok(model::AnomalyType {
            id: row.get(0)?,
            name: row.get(1)?,
        })
    }))?;
    sql(rows.collect::<SqlResult<Vec<_>>>())
}

pub fn get_all_epi(connection: &Connection) -> DbResult<Vec<Epi>> {
    let mut stmt = sql(connection.prepare(
        "SELECT id, nature_id, serial, date_mise_en_service, date_fabrication, validite_years,
                assigned_to_id, emplacement_id, date_last_control, date_rebus, anomaly_id
         FROM epi
         ORDER BY id",
    ))?;
    let rows = sql(stmt.query_map([], |row| {
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
    }))?;
    sql(rows.collect::<SqlResult<Vec<_>>>())
}

pub fn save_epi(connection: &Connection, epi: &Epi) -> DbResult<i32> {
    if let Some(id) = positive_id(epi.id) {
        let changed = sql(connection.execute(
            "UPDATE epi SET
                nature_id = :nature_id,
                serial = :serial,
                date_mise_en_service = :date_mise_en_service,
                date_fabrication = :date_fabrication,
                validite_years = :validite_years,
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
        ))?;
        if changed == 0 {
            return Err(format!("EPI {id} introuvable"));
        }
        Ok(id)
    } else {
        sql(connection.execute(
            "INSERT INTO epi (
                nature_id,
                serial,
                date_mise_en_service,
                date_fabrication,
                validite_years,
                assigned_to_id,
                emplacement_id,
                date_last_control,
                date_rebus,
                anomaly_id
            ) VALUES (
                :nature_id,
                :serial,
                :date_mise_en_service,
                :date_fabrication,
                :validite_years,
                :assigned_to_id,
                :emplacement_id,
                :date_last_control,
                :date_rebus,
                :anomaly_id
            )",
            named_params! {
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
        ))?;
        Ok(connection.last_insert_rowid() as i32)
    }
}

pub fn delete_epi(connection: &Connection, id: i32) -> DbResult<()> {
    delete_row(connection, "DELETE FROM epi WHERE id = ?1", id, "EPI")
}

pub fn get_all_levage(connection: &Connection) -> DbResult<Vec<Levage>> {
    let mut stmt = sql(connection.prepare(
        "SELECT id, nature_id, serial, date_mise_en_service, cmu_kg, longueur_m, essai_charge_kg,
                assigned_to_id, emplacement_id, date_last_control, date_rebus, anomaly_id
         FROM levage
         ORDER BY id",
    ))?;
    let rows = sql(stmt.query_map([], |row| {
        Ok(Levage {
            id: Some(row.get(0)?),
            nature_id: row.get(1)?,
            serial: row.get(2)?,
            date_mise_en_service: row.get(3)?,
            cmu_kg: row.get(4)?,
            longueur_m: row.get(5)?,
            essai_charge_kg: row.get(6)?,
            assigned_to_id: row.get(7)?,
            emplacement_id: row.get(8)?,
            date_last_control: row.get(9)?,
            date_rebus: row.get(10)?,
            anomaly_id: row.get(11)?,
        })
    }))?;
    sql(rows.collect::<SqlResult<Vec<_>>>())
}

pub fn save_levage(connection: &Connection, levage: &Levage) -> DbResult<i32> {
    if let Some(id) = positive_id(levage.id) {
        let changed = sql(connection.execute(
            "UPDATE levage SET
                nature_id = :nature_id,
                serial = :serial,
                date_mise_en_service = :date_mise_en_service,
                cmu_kg = :cmu_kg,
                longueur_m = :longueur_m,
                essai_charge_kg = :essai_charge_kg,
                assigned_to_id = :assigned_to_id,
                emplacement_id = :emplacement_id,
                date_last_control = :date_last_control,
                date_rebus = :date_rebus,
                anomaly_id = :anomaly_id
             WHERE id = :id",
            named_params! {
                ":id": id,
                ":nature_id": levage.nature_id,
                ":serial": levage.serial,
                ":date_mise_en_service": levage.date_mise_en_service,
                ":cmu_kg": levage.cmu_kg,
                ":longueur_m": levage.longueur_m,
                ":essai_charge_kg": levage.essai_charge_kg,
                ":assigned_to_id": levage.assigned_to_id,
                ":emplacement_id": levage.emplacement_id,
                ":date_last_control": levage.date_last_control,
                ":date_rebus": levage.date_rebus,
                ":anomaly_id": levage.anomaly_id
            },
        ))?;
        if changed == 0 {
            return Err(format!("Levage {id} introuvable"));
        }
        Ok(id)
    } else {
        sql(connection.execute(
            "INSERT INTO levage (
                nature_id,
                serial,
                date_mise_en_service,
                cmu_kg,
                longueur_m,
                essai_charge_kg,
                assigned_to_id,
                emplacement_id,
                date_last_control,
                date_rebus,
                anomaly_id
            ) VALUES (
                :nature_id,
                :serial,
                :date_mise_en_service,
                :cmu_kg,
                :longueur_m,
                :essai_charge_kg,
                :assigned_to_id,
                :emplacement_id,
                :date_last_control,
                :date_rebus,
                :anomaly_id
            )",
            named_params! {
                ":nature_id": levage.nature_id,
                ":serial": levage.serial,
                ":date_mise_en_service": levage.date_mise_en_service,
                ":cmu_kg": levage.cmu_kg,
                ":longueur_m": levage.longueur_m,
                ":essai_charge_kg": levage.essai_charge_kg,
                ":assigned_to_id": levage.assigned_to_id,
                ":emplacement_id": levage.emplacement_id,
                ":date_last_control": levage.date_last_control,
                ":date_rebus": levage.date_rebus,
                ":anomaly_id": levage.anomaly_id
            },
        ))?;
        Ok(connection.last_insert_rowid() as i32)
    }
}

pub fn delete_levage(connection: &Connection, id: i32) -> DbResult<()> {
    delete_row(connection, "DELETE FROM levage WHERE id = ?1", id, "Levage")
}

pub fn save_anomaly(connection: &Connection, anomaly: &Anomaly) -> DbResult<i32> {
    let date_resolution = anomaly.date_resolution.filter(|value| *value != 0);
    if let Some(id) = positive_id(anomaly.id) {
        let changed = sql(connection.execute(
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
                ":date_detection": anomaly.date_detection,
                ":date_resolution": date_resolution
            },
        ))?;
        if changed == 0 {
            return Err(format!("Anomalie {id} introuvable"));
        }
        Ok(id)
    } else {
        sql(connection.execute(
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
                ":date_detection": anomaly.date_detection,
                ":date_resolution": date_resolution
            },
        ))?;
        Ok(connection.last_insert_rowid() as i32)
    }
}

pub fn get_all_anomalies(connection: &Connection) -> DbResult<Vec<Anomaly>> {
    let mut stmt = sql(connection.prepare(
        "SELECT id, anomaly_type_id, description, criticity, date_detection, date_resolution
         FROM anomalies
         ORDER BY id",
    ))?;
    let rows = sql(stmt.query_map([], |row| {
        Ok(Anomaly {
            id: Some(row.get(0)?),
            anomaly_type_id: row.get(1)?,
            description: row.get(2)?,
            criticity: row.get(3)?,
            date_detection: row.get(4)?,
            date_resolution: row.get(5)?,
        })
    }))?;
    sql(rows.collect::<SqlResult<Vec<_>>>())
}

#[cfg(test)]
pub fn foreign_keys_enabled(connection: &Connection) -> DbResult<i64> {
    sql(connection.pragma_query_value(None, "foreign_keys", |row| row.get(0)))
}
