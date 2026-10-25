#[cfg(test)]
mod tests {
    use std::fs;

    use rusqlite::Connection;

    use crate::{
        database,
        model::{Anomaly, Epi, Levage, People},
        state::AppConfigData,
    };

    fn memory_db() -> Connection {
        let connection = database::open_db(":memory:").expect("open memory db");
        database::init_db(&connection).expect("init memory db");
        connection
    }

    fn index_table(connection: &Connection, index_name: &str) -> Option<String> {
        connection
            .query_row(
                "SELECT tbl_name FROM sqlite_master WHERE type = 'index' AND name = ?1",
                [index_name],
                |row| row.get(0),
            )
            .ok()
    }

    #[test]
    fn read_people() {
        let people = People {
            id: 1,
            prenom: "John".to_string(),
            nom: "Doe".to_string(),
        };
        let json = serde_json::to_string(&people).unwrap();
        let read_people: People = serde_json::from_str(&json).unwrap();
        assert_eq!(people, read_people);
    }

    #[test]
    fn read_epi() {
        let epi = Epi {
            id: None,
            nature_id: 1,
            serial: "123456789".to_string(),
            date_mise_en_service: Some(1_711_636_638),
            date_fabrication: Some(1_711_636_638),
            validite_years: Some(5),
            anomaly_id: None,
            assigned_to_id: None,
            emplacement_id: None,
            date_last_control: None,
            date_rebus: None,
        };
        let json = serde_json::to_string(&epi).unwrap();
        let read_epi: Epi = serde_json::from_str(&json).unwrap();
        assert_eq!(epi, read_epi);
    }

    #[test]
    fn parse_epi() {
        let json = r#"{"id":1,"nature_id":1,"serial":"123456789","date_mise_en_service":1711636638,"date_fabrication":1711636638,"validite_years":5,"anomaly":null,"assigned_to":null,"emplacement":null,"date_last_control":null,"date_rebus":null}"#;
        let epi: Epi = serde_json::from_str(json).unwrap();
        assert_eq!(epi.serial, "123456789");
        assert_eq!(epi.nature_id, 1);
        assert_eq!(epi.date_fabrication, Some(1_711_636_638));
        assert_eq!(epi.validite_years, Some(5));
        assert_eq!(epi.anomaly_id, None);
        assert_eq!(epi.assigned_to_id, None);
        assert_eq!(epi.emplacement_id, None);
    }

    #[test]
    fn write_read_ini() {
        let test_config_path = std::env::temp_dir().join(format!(
            "levage-test-ini-{}-{}.ini",
            std::process::id(),
            "write-read"
        ));
        let _ = fs::remove_file(&test_config_path);
        let db_default_path = "test.db";
        {
            let mut config = configparser::ini::Ini::new();
            config.set("PATH", "db", Some(db_default_path.to_string()));
            config.write(&test_config_path).unwrap();
        }
        {
            let mut config = configparser::ini::Ini::new();
            config.load(&test_config_path).unwrap();
            let path = config.get("PATH", "db").unwrap();
            assert_eq!(path, db_default_path);
        }
        let _ = fs::remove_file(&test_config_path);
    }

    #[test]
    fn load_ini_missing_file_does_not_panic() {
        let config = AppConfigData::new();
        let missing = std::env::temp_dir().join(format!(
            "levage-missing-{}-does-not-exist.ini",
            std::process::id()
        ));
        let _ = fs::remove_file(&missing);
        *config.ini_path.lock().unwrap() = missing.to_string_lossy().into_owned();
        let loaded = config.load_ini().expect("missing ini must not panic");
        assert!(!loaded);
    }

    #[test]
    fn set_db_path_reports_unwritable_directory() {
        let config = AppConfigData::new();
        *config.ini_path.lock().unwrap() = "/proc/levage-not-writable.ini".to_string();
        let result = config.set_db_path("/tmp/should-not-be-saved.db".to_string());
        assert!(
            result.is_err(),
            "writing ini into /proc must fail instead of panicking: {result:?}"
        );
    }

    #[test]
    fn default_database_path_is_absolute() {
        let config = AppConfigData::new();
        let db_path = config.db_path.lock().unwrap().clone();
        let ini_path = config.ini_path.lock().unwrap().clone();
        assert!(std::path::Path::new(&db_path).is_absolute(), "{db_path}");
        assert!(std::path::Path::new(&ini_path).is_absolute(), "{ini_path}");
        assert_ne!(db_path, "test.db");
    }

    #[test]
    fn schema_creates_distinct_unique_indexes_and_enforces_foreign_keys() {
        let connection = memory_db();
        assert_eq!(database::foreign_keys_enabled(&connection).unwrap(), 1);
        assert_eq!(
            index_table(&connection, "idx_epi_serial").as_deref(),
            Some("epi")
        );
        assert_eq!(
            index_table(&connection, "idx_levage_serial").as_deref(),
            Some("levage")
        );

        let bad_epi = connection.execute(
            "INSERT INTO epi (nature_id, serial) VALUES (999999, 'missing-nature')",
            [],
        );
        assert!(bad_epi.is_err(), "foreign key to epi_materiel must be enforced");

        let epi_count_before = connection
            .query_row("SELECT COUNT(*) FROM epi_materiel", [], |row| row.get::<_, i64>(0))
            .unwrap();
        database::init_db(&connection).unwrap();
        let epi_count_after = connection
            .query_row("SELECT COUNT(*) FROM epi_materiel", [], |row| row.get::<_, i64>(0))
            .unwrap();
        assert_eq!(epi_count_before, epi_count_after);
        assert!(epi_count_after > 0);
        assert!(
            connection
                .query_row("SELECT COUNT(*) FROM levage_materiel", [], |row| {
                    row.get::<_, i64>(0)
                })
                .unwrap()
                > 0
        );
        assert!(
            connection
                .query_row("SELECT COUNT(*) FROM people", [], |row| row.get::<_, i64>(0))
                .unwrap()
                > 0
        );
        assert!(
            connection
                .query_row("SELECT COUNT(*) FROM emplacement", [], |row| {
                    row.get::<_, i64>(0)
                })
                .unwrap()
                > 0
        );
        assert!(
            connection
                .query_row("SELECT COUNT(*) FROM anomaly_type", [], |row| {
                    row.get::<_, i64>(0)
                })
                .unwrap()
                > 0
        );
    }

    #[test]
    fn save_returns_ids_and_keeps_serials_independent() {
        let connection = memory_db();
        let nature_id = database::add_epi_materiel(&connection, "Casque test").unwrap();
        let levage_nature_id = database::add_levage_materiel(&connection, "Palan test").unwrap();

        let mut epi = Epi {
            id: Some(0),
            nature_id,
            serial: "EPI-001".to_string(),
            date_mise_en_service: None,
            date_fabrication: None,
            validite_years: Some(5),
            assigned_to_id: None,
            emplacement_id: None,
            date_last_control: None,
            date_rebus: None,
            anomaly_id: None,
        };
        let epi_id = database::save_epi(&connection, &epi).unwrap();
        assert!(epi_id > 0);
        epi.id = Some(epi_id);
        epi.validite_years = Some(8);
        assert_eq!(database::save_epi(&connection, &epi).unwrap(), epi_id);

        let duplicate = database::save_epi(
            &connection,
            &Epi {
                id: None,
                serial: "EPI-001".to_string(),
                ..epi.clone()
            },
        );
        assert!(duplicate.is_err(), "epi serial must be unique");

        let levage = Levage {
            id: None,
            nature_id: levage_nature_id,
            serial: "EPI-001".to_string(),
            cmu_kg: Some(500),
            longueur_m: Some(2.5),
            essai_charge_kg: Some(750),
            date_mise_en_service: None,
            assigned_to_id: None,
            emplacement_id: None,
            date_last_control: None,
            date_rebus: None,
            anomaly_id: None,
        };
        let levage_id = database::save_levage(&connection, &levage).unwrap();
        assert!(levage_id > 0);
        let stored = database::get_all_levage(&connection).unwrap();
        let stored_levage = stored.iter().find(|item| item.id == Some(levage_id)).unwrap();
        assert_eq!(stored_levage.longueur_m, Some(2.5));
        assert_eq!(stored_levage.serial, "EPI-001");

        let duplicate_levage = database::save_levage(
            &connection,
            &Levage {
                id: None,
                serial: "EPI-001".to_string(),
                ..levage.clone()
            },
        );
        assert!(duplicate_levage.is_err(), "levage serial must be unique");
    }

    #[test]
    fn unresolved_anomaly_stores_null_resolution_date() {
        let connection = memory_db();
        let anomaly_type_id = database::add_anomaly_type(&connection, "Usure test").unwrap();
        let inserted = database::save_anomaly(
            &connection,
            &Anomaly {
                id: None,
                anomaly_type_id,
                description: "sangle effilochée".to_string(),
                criticity: 2,
                date_detection: 1_700_000_000_000,
                date_resolution: None,
            },
        )
        .unwrap();
        assert!(inserted > 0);

        let raw: Option<i64> = connection
            .query_row(
                "SELECT date_resolution FROM anomalies WHERE id = ?1",
                [inserted],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(raw, None);

        let loaded = database::get_all_anomalies(&connection)
            .unwrap()
            .into_iter()
            .find(|item| item.id == Some(inserted))
            .unwrap();
        assert_eq!(loaded.date_resolution, None);
        assert_eq!(loaded.date_detection, 1_700_000_000_000);

        database::save_anomaly(
            &connection,
            &Anomaly {
                id: Some(inserted),
                anomaly_type_id,
                description: "sangle effilochée".to_string(),
                criticity: 1,
                date_detection: 1_700_000_000_000,
                date_resolution: Some(1_700_000_100_000),
            },
        )
        .unwrap();
        database::save_anomaly(
            &connection,
            &Anomaly {
                id: Some(inserted),
                anomaly_type_id,
                description: "sangle effilochée".to_string(),
                criticity: 2,
                date_detection: 1_700_000_000_000,
                date_resolution: Some(0),
            },
        )
        .unwrap();
        let cleared: Option<i64> = connection
            .query_row(
                "SELECT date_resolution FROM anomalies WHERE id = ?1",
                [inserted],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(cleared, None);
    }
}
