#[cfg(test)]
mod tests {
    use chrono::Local;

    use crate::model::{Epi, EpiMateriel, People};

    #[test]
    fn read_people() {
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
    fn read_epi() {
        let epi = Epi {
            id: None,
            nature_id: 1,
            serial: "123456789".to_string(),
            date_mise_en_service: 1711636638,
            date_fabrication: 1711636638,
            validite_years: 5,
            anomaly_id: None,
            assigned_to_id: None,
            emplacement_id: None,
            date_last_control: None,
            date_rebus: None,
        };
        let json = serde_json::to_string(&epi).unwrap();
        println!("{}", &json);
        let read_epi: Epi = serde_json::from_str(&json).unwrap();
        assert_eq!(epi.id, read_epi.id);
        assert_eq!(epi.serial, read_epi.serial);
        assert_eq!(epi.nature_id, read_epi.nature_id);
        assert_eq!(epi.date_fabrication, read_epi.date_fabrication);
    }

    #[test]
    fn parse_epi() {
        let json = r#"{"id":1,"nature_id":1,"serial":"123456789","date_mise_en_service":1711636638,"date_fabrication":1711636638,"validite_years":5,"anomaly":null,"assigned_to":null,"emplacement":null,"date_last_control":null,"date_rebus":null}"#;
        let epi: Epi = serde_json::from_str(&json).unwrap();
        assert_eq!(epi.serial, "123456789");
        assert_eq!(epi.nature_id, 1);
        assert_eq!(epi.date_fabrication, 1711636638);
        assert_eq!(epi.validite_years, 5);
    }

    #[test]
    fn write_read_ini() {
        let test_config_path = "test.ini";
        let db_default_path = "test.db";
        {
            let mut config = configparser::ini::Ini::new();
            let default_path = Some(db_default_path.to_string());

            assert!(default_path.is_some());

            config.set("PATH", "db", default_path);
            config.write(test_config_path).unwrap();
        }
        {
            let mut config = configparser::ini::Ini::new();
            config.load(test_config_path).unwrap();
            let path = config.get("PATH", "db");
            assert!(path.is_some());
            let path = path.unwrap();
            assert_eq!(path, db_default_path);
        }
    }
}
