use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::io;

// Definimos un tipo específico para los errores de la aplicación
#[derive(Debug)]
pub enum AppError {
    IoError(io::Error),
    JsonError(serde_json::Error),
    LockError(String),
}

impl From<io::Error> for AppError {
    fn from(err: io::Error) -> Self {
        AppError::IoError(err)
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::JsonError(err)
    }
}

impl ToString for AppError {
    fn to_string(&self) -> String {
        match self {
            AppError::IoError(e) => format!("IO Error: {}", e),
            AppError::JsonError(e) => format!("JSON Error: {}", e),
            AppError::LockError(e) => format!("Lock Error: {}", e),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: String,
    pub client_id: String,
    pub title: String,
    pub description: String,
    pub completed: bool,
    pub created_at: String,
    pub priority: TaskPriority,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Client {
    pub id: String,
    pub name: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum TaskPriority {
    Low,
    Medium,
    High,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppData {
    pub tasks: HashMap<String, Task>,
    pub clients: HashMap<String, Client>,
}

pub struct AppState {
    pub data: Mutex<AppData>,
    pub data_file: PathBuf,
}

impl AppState {
    pub fn new(app_dir: PathBuf) -> Result<Self, AppError> {
        // Asegurarse que el directorio existe
        fs::create_dir_all(&app_dir)?;
        let data_file = app_dir.join("data.json");
        
        println!("Data file path: {:?}", data_file); // Debug log
        
        let data = if data_file.exists() {
            println!("Reading existing data file"); // Debug log
            let content = fs::read_to_string(&data_file)?;
            serde_json::from_str(&content).unwrap_or_else(|e| {
                println!("Error parsing data file: {}. Creating new data.", e); // Debug log
                AppData {
                    tasks: HashMap::new(),
                    clients: HashMap::new(),
                }
            })
        } else {
            println!("Creating new data file"); // Debug log
            AppData {
                tasks: HashMap::new(),
                clients: HashMap::new(),
            }
        };
        
        Ok(Self {
            data: Mutex::new(data),
            data_file,
        })
    }
    
    pub fn save(&self) -> Result<(), AppError> {
        let data = self.data.lock()
            .map_err(|e| AppError::LockError(e.to_string()))?;
            
        println!("Saving data to: {:?}", self.data_file); // Debug log
        
        // Primero escribimos a un archivo temporal
        let temp_file = self.data_file.with_extension("tmp");
        let content = serde_json::to_string_pretty(&*data)?;
        
        fs::write(&temp_file, &content)?;
        
        // Luego hacemos un reemplazo atómico
        fs::rename(temp_file, &self.data_file)?;
        
        println!("Data saved successfully"); // Debug log
        Ok(())
    }
    
    pub fn read(&self) -> Result<AppData, AppError> {
        let data = self.data.lock()
            .map_err(|e| AppError::LockError(e.to_string()))?;
        Ok((*data).clone())
    }
}