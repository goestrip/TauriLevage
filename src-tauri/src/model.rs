use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum Criticity {
    None = 0,
    Processed = 1,
    Low = 2,
    Medium = 3,
    High = 4,
}
impl Default for Criticity {
    fn default() -> Self {
        Criticity::None
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnomalyType {
    pub id: i32,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Anomaly {
    pub id: Option<i32>,
    pub anomaly_type_id: i32,
    pub description: String,
    pub criticity: i32,
    pub date_detection: i64,
    pub date_resolution: Option<i64>,
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
    pub date_mise_en_service: Option<i64>, //timestamp
    pub date_fabrication: Option<i64>,     //timestamp
    pub validite_years: Option<i32>,
    pub assigned_to_id: Option<i32>,
    pub emplacement_id: Option<i32>,
    pub date_last_control: Option<i64>,
    pub date_rebus: Option<i64>,
    pub anomaly_id: Option<i32>,
}

// Define the LevageMateriel struct
#[derive(Debug, Serialize, Deserialize)]
pub struct LevageMateriel {
    pub id: i32,
    pub nature: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Levage{
    pub id: Option<i32>,
    pub nature_id: i32,
    pub serial: String,
    pub cmu_kg: Option<i32>,
    pub longueur_m: Option<f32>,
    pub essai_charge_kg: Option<i32>,
    pub date_mise_en_service: Option<i64>, //timestamp
    pub assigned_to_id: Option<i32>,
    pub emplacement_id: Option<i32>,
    pub date_last_control: Option<i64>,
    pub date_rebus: Option<i64>,
    pub anomaly_id: Option<i32>,
}
