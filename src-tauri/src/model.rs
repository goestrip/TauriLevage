use serde::{Deserialize, Serialize};

#[allow(dead_code)]
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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AnomalyType {
    pub id: i32,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Anomaly {
    #[serde(default)]
    pub id: Option<i32>,
    pub anomaly_type_id: i32,
    pub description: String,
    pub criticity: i32,
    pub date_detection: i64,
    #[serde(default)]
    pub date_resolution: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Emplacement {
    pub id: i32,
    pub location: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct EpiMateriel {
    pub id: i32,
    pub nature: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct People {
    pub id: i32,
    pub prenom: String,
    pub nom: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Epi {
    #[serde(default)]
    pub id: Option<i32>,
    pub nature_id: i32,
    pub serial: String,
    #[serde(default)]
    pub date_mise_en_service: Option<i64>,
    #[serde(default)]
    pub date_fabrication: Option<i64>,
    #[serde(default)]
    pub validite_years: Option<i32>,
    #[serde(default)]
    pub assigned_to_id: Option<i32>,
    #[serde(default)]
    pub emplacement_id: Option<i32>,
    #[serde(default)]
    pub date_last_control: Option<i64>,
    #[serde(default)]
    pub date_rebus: Option<i64>,
    #[serde(default)]
    pub anomaly_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct LevageMateriel {
    pub id: i32,
    pub nature: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Levage {
    #[serde(default)]
    pub id: Option<i32>,
    pub nature_id: i32,
    pub serial: String,
    #[serde(default)]
    pub cmu_kg: Option<i32>,
    #[serde(default)]
    pub longueur_m: Option<f32>,
    #[serde(default)]
    pub essai_charge_kg: Option<i32>,
    #[serde(default)]
    pub date_mise_en_service: Option<i64>,
    #[serde(default)]
    pub assigned_to_id: Option<i32>,
    #[serde(default)]
    pub emplacement_id: Option<i32>,
    #[serde(default)]
    pub date_last_control: Option<i64>,
    #[serde(default)]
    pub date_rebus: Option<i64>,
    #[serde(default)]
    pub anomaly_id: Option<i32>,
}
