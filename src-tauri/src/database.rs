use rusqlite::{Connection, Result};

use crate::model::EpiMateriel;

//open a sqlite db
pub fn open_db()-> Result<Connection> {
    let path = "test.db";
    let connection = Connection::open(path)?;
    return Ok(connection);
}

pub fn init_db(connection: &Connection)-> Result<()> {
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
            date_mise_en_service TEXT NOT NULL,
            date_fabrication TEXT NOT NULL,
            validite_years INTEGER NOT NULL,
            assigned_to_id INTEGER,
            emplacement_id INTEGER,
            date_last_control TEXT,
            date_rebus TEXT,
            FOREIGN KEY(nature_id) REFERENCES epi_materiel(id),
            FOREIGN KEY(assigned_to_id) REFERENCES people(id),
            FOREIGN KEY(emplacement_id) REFERENCES emplacement(id)
        )",
        [],
    )?;

    Ok(())
}

pub fn get_all_epi_materiel(connection: &Connection) -> Result<Vec<EpiMateriel>> {
    let mut stmt = connection.prepare("SELECT id, nature FROM epi_materiel")?;
    let epi_materiel_iter = stmt.query_map([], |row| {
        Ok(EpiMateriel{
           id : row.get(0)?,
           nature: row.get(1)?
        })
    })?;


    Ok(epi_materiel_iter.collect::<Result<Vec<EpiMateriel>>>()?)
}
