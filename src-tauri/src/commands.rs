use chrono::NaiveDate;
use serde::ser::{Serialize, SerializeStruct, Serializer};

use crate::model::{Epi, EpiMateriel};


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
pub fn load_epi() -> String {
    let testEpi = Epi {
        id: 1,
        nature: EpiMateriel{
            id: 1,
            name: "test".to_string(),
            category: "test".to_string()
        },
        serial: "test".to_string(),
        date_mise_en_service: NaiveDate::from_ymd_opt(2021, 1, 1).unwrap(),
        date_fabrication: NaiveDate::from_ymd_opt(2021, 1, 1).unwrap(),
        validite_years: 10,
        date_last_control: None,
        date_rebus: None,
        assigned_to: None,
        emplacement: None,
        anomalies: Vec::new(),
    };
    serde_json::to_string(&testEpi).unwrap()
}
