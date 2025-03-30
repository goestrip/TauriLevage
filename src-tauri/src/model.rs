use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum Criticity {
    None,
    Low,
    Medium,
    High,
}
impl Default for Criticity {
    fn default() -> Self {
        Criticity::None
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Anomaly {
    pub id: i32,
    pub title: String,
    pub description: String,
    pub criticity: Criticity,
    pub is_handled: bool,
    pub date_detection: NaiveDate,
    pub date_resolution: Option<NaiveDate>,
}
impl Default for Anomaly {
    fn default() -> Self {
        Anomaly {
            id: 0,
            title: String::new(),
            description: String::new(),
            criticity: Criticity::None,
            is_handled: false,
            date_detection: NaiveDate::from_ymd_opt(2015, 2, 29).unwrap(),
            date_resolution: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Emplacement {
    // Define the fields for Emplacement
    // Example:
    pub id: i32,
    pub location: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EpiMateriel {
    // Define the fields for EpiMateriel
    // Example:
    pub id: i32,
    pub nature: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct People {
    // Define the fields for People
    // Example:
    pub id: i32,
    pub prenom: String,
    pub nom: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Epi {
    pub id: Option<i32>,
    pub nature_id: i32,
    pub serial: String,
    pub date_mise_en_service: i64, //timestamp
    pub date_fabrication: i64,     //timestamp
    pub validite_years: i32,
    pub assigned_to_id: Option<i32>,
    pub emplacement_id: Option<i32>,
    pub date_last_control: Option<i64>,
    pub date_rebus: Option<i64>,
    pub anomaly_id: Option<i32>,
}
