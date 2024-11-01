use tauri::State;
use tauri::Manager;
use tauri_app_lib::{Task, Client, TaskPriority, AppState};

#[tauri::command]
fn add_client(
    name: String,
    description: String,
    state: State<AppState>,
) -> Result<Client, String> {
    let mut data = state.data.lock().map_err(|_| "Failed to lock state")?;
    
    let client = Client {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        description,
    };
    
    data.clients.insert(client.id.clone(), client.clone());
    state.save()?;
    
    Ok(client)
}

#[tauri::command]
fn get_clients(state: State<AppState>) -> Result<Vec<Client>, String> {
    let data = state.data.lock().map_err(|_| "Failed to lock state")?;
    Ok(data.clients.values().cloned().collect())
}

#[tauri::command]
fn add_task(
    client_id: String,
    title: String,
    description: String,
    priority: TaskPriority,
    state: State<AppState>,
) -> Result<Task, String> {
    let mut data = state.data.lock().map_err(|_| "Failed to lock state")?;
    
    let task = Task {
        id: uuid::Uuid::new_v4().to_string(),
        client_id,
        title,
        description,
        completed: false,
        created_at: chrono::Utc::now().to_rfc3339(),
        priority,
    };
    
    data.tasks.insert(task.id.clone(), task.clone());
    state.save()?;
    
    Ok(task)
}

#[tauri::command]
fn get_tasks_by_client(
    client_id: String,
    state: State<AppState>,
) -> Result<Vec<Task>, String> {
    let data = state.data.lock().map_err(|_| "Failed to lock state")?;
    Ok(data.tasks
        .values()
        .filter(|task| task.client_id == client_id)
        .cloned()
        .collect())
}

#[tauri::command]
fn toggle_task(id: String, state: State<AppState>) -> Result<Task, String> {
    let mut data = state.data.lock().map_err(|_| "Failed to lock state")?;
    
    let task = data.tasks.get_mut(&id).ok_or("Task not found")?;
    task.completed = !task.completed;
    state.save()?;
    
    Ok(task.clone())
}

#[tauri::command]
fn delete_task(id: String, state: State<AppState>) -> Result<(), String> {
    let mut data = state.data.lock().map_err(|_| "Failed to lock state")?;
    data.tasks.remove(&id).ok_or("Task not found")?;
    state.save()?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Obtener el directorio de datos de la app
            let app_dir = app
                .app_handle()
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");
            // Inicializar el estado con persistencia
            let state = AppState::new(app_dir);
            app.manage(state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            add_client,
            get_clients,
            add_task,
            get_tasks_by_client,
            toggle_task,
            delete_task,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}