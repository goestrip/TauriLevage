use chrono::NaiveDate;
use serde::{Serialize, Deserialize};
use serde::ser::{Serializer, SerializeStruct};

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



#[derive(Debug, Clone)]
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
impl Serialize for Anomaly {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut s = serializer.serialize_struct("Anomaly", 2)?;
        s.serialize_field("id", &self.id)?;
        s.serialize_field("title", &self.title)?;
        s.serialize_field("description", &self.description)?;
        s.serialize_field("criticity", &criticy)?;
        s.serialize_field("is_handled", &self.is_handled)?;
        s.serialize_field("date_detection", &self.date_detection)?;
        s.serialize_field("date_resolution", &self.date_resolution)?;
        s.end()
    }
}



#[derive(Debug, Clone)]
pub struct Emplacement {
    // Define the fields for Emplacement
    // Example:
    pub id: i32,
    pub location: String,
}
impl Serialize for Emplacement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut s = serializer.serialize_struct("Emplacement", 2)?;
        s.serialize_field("id", &self.id)?;
        s.serialize_field("location", &self.location)?;
        s.end()
    }
}

#[derive(Debug, Clone)]
pub struct EpiMateriel {
    // Define the fields for EpiMateriel
    // Example:
    pub id: i32,
    pub name: String,
    pub category: String,
}
impl Serialize for EpiMateriel {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut s = serializer.serialize_struct("EpiMateriel", 2)?;
        s.serialize_field("id", &self.id)?;
        s.serialize_field("name", &self.name)?;
        s.serialize_field("category", &self.category)?;
        s.end()
    }
}

#[derive(Debug, Clone)]
pub struct People {
    // Define the fields for People
    // Example:
    pub id: i32,
    pub prenom: String,
    pub nom: String,
}
impl Serialize for People {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut s = serializer.serialize_struct("People", 2)?;
        s.serialize_field("id", &self.id)?;
        s.serialize_field("prenom", &self.prenom)?;
        s.serialize_field("nom", &self.nom)?;
        s.end()
    }
}


#[derive(Debug, Clone)]
pub struct Epi {
    pub id: i32,
    pub nature: EpiMateriel,
    pub serial: String,
    pub date_mise_en_service: NaiveDate,
    pub date_fabrication: NaiveDate,
    pub validite_years: i32,
    pub assigned_to: Option<People>,
    pub emplacement: Option<Emplacement>,
    pub date_last_control: Option<NaiveDate>,
    pub date_rebus: Option<NaiveDate>,
    pub anomalies: Vec<Anomaly>,
}

impl Serialize for Epi {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut s = serializer.serialize_struct("Epi", 11)?;
        s.serialize_field("id", &self.id)?;
        s.serialize_field("nature", &self.nature)?;
        s.serialize_field("serial", &self.serial)?;
        s.serialize_field("date_mise_en_service", &self.date_mise_en_service)?;
        s.serialize_field("date_fabrication", &self.date_fabrication)?;
        s.serialize_field("validite_years", &self.validite_years)?;
        s.serialize_field("assigned_to", &self.assigned_to)?;
        s.serialize_field("emplacement", &self.emplacement)?;
        s.serialize_field("date_last_control", &self.date_last_control)?;
        s.serialize_field("date_rebus", &self.date_rebus)?;
        s.serialize_field("anomalies", &self.anomalies)?;
        s.end()
    }
}

