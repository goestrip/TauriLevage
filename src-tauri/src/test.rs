
#[cfg(test)]
mod tests {
    use chrono::Local;

    use crate::model::{Epi, EpiMateriel, People};

    #[test]
    fn read_people(){
        let people = People {
            id: 1,
            prenom: "John".to_string(),
            nom: "Doe".to_string(),
        };
        let json = serde_json::to_string(&people).unwrap();
        println!("{}", &json);
        let read_people: People = serde_json::from_str(&json).unwrap();
        assert_eq!(people, read_people);
    }

    #[test]
    fn read_epi(){
        let materiel = EpiMateriel {
            id: 1,
            nature: "Nature".to_string(),
        };
        let epi = Epi {
            id: 1,
            nature: materiel,
            serial: "123456789".to_string(),
            date_mise_en_service: Local::now(),
            date_fabrication: Local::now(),
            validite_years: 5,
            anomaly: None,
            assigned_to: None,
            emplacement: None,
            date_last_control: None,
            date_rebus: None,
        };
        let json = serde_json::to_string(&epi).unwrap();
        println!("{}", &json);
        let read_epi: Epi = serde_json::from_str(&json).unwrap();
        assert_eq!(epi.id, read_epi.id);
        assert_eq!(epi.serial, read_epi.serial);
        assert_eq!(epi.nature.id, read_epi.nature.id);
        assert_eq!(epi.nature.nature, read_epi.nature.nature);
        assert_eq!(epi.date_fabrication, read_epi.date_fabrication);
    }
}
