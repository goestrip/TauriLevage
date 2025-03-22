use serde::ser::{Serialize, SerializeStruct, Serializer};

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
pub fn load_user() -> String {
    let alice = User {
        name: "Alice".to_string(),
        age: 42,
    };
    serde_json::to_string(&alice).unwrap()
}
