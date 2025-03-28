use chrono::{DateTime, Local, NaiveDate};
use serde::{Serialize, Deserialize};


#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum Criticity {
    None ,
    Low ,
    Medium,
    High ,
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
    pub id: i32,
    pub nature: EpiMateriel,
    pub serial: String,
    pub date_mise_en_service: DateTime<Local>,
    pub date_fabrication: DateTime<Local>,
    pub validite_years: i32,
    pub assigned_to: Option<People>,
    pub emplacement: Option<Emplacement>,
    pub date_last_control: Option<NaiveDate>,
    pub date_rebus: Option<NaiveDate>,
    pub anomaly: Option<Anomaly>,
}

