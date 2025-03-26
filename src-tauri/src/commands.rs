use std::io::{self, Write};

use chrono::NaiveDate;
use serde::ser::{Serialize, SerializeStruct, Serializer};

use crate::{database, model::{Epi, EpiMateriel}};


// Define the User struct
struct User {
    name: String,
    age: i32,
}

impl Serialize for User {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut s = serializer.serialize_struct("User", 2)?;
        s.serialize_field("name", &self.name)?;
        s.serialize_field("age", &self.age)?;
        s.end()
    }
}


#[tauri::command]
pub fn init_database() -> Result<String, String> {
    let connection = database::open_db().map_err(|e| e.to_string())?;
    database::init_db(&connection).map_err(|e| e.to_string())?;
    Ok("Database initialized".to_string())
}


// #[tauri::command]
// pub fn load_epi() -> String {
//     let test_epi = Epi {
//         id: 1,
//         nature: EpiMateriel{
//             id: 1,
//             nature: "test".to_string(),
//         },
//         serial: "test".to_string(),
//         date_mise_en_service: NaiveDate::from_ymd_opt(2021, 1, 1).unwrap(),
//         date_fabrication: NaiveDate::from_ymd_opt(2021, 1, 1).unwrap(),
//         validite_years: 10,
//         date_last_control: None,
//         date_rebus: None,
//         assigned_to: None,
//         emplacement: None,
//         anomaly: None,
//     };
//     serde_json::to_string(&test_epi).unwrap()
// }

#[tauri::command]
pub fn save_epi(epi: String)-> String {
    print!("{}", epi);
    io::stdout().flush().expect("Unable to flush stdout");

    let epi_parsed: Epi = serde_json::from_str(&epi).unwrap();
    // println!("{:?}", epi_parsed);
    serde_json::to_string(&epi_parsed).unwrap()
}

#[tauri::command]
pub fn get_epi_materiel()-> Result<String, String>{
    let connection = database::open_db().map_err(|e| e.to_string())?;
    let epi_materiel = database::get_all_epi_materiel(&connection).map_err(|e| e.to_string())?;

    Ok(serde_json::to_string(&epi_materiel).unwrap())
}

