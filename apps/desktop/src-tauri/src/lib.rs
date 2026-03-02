mod sync;

use std::path::PathBuf;
use sync::SyncManager;

#[tauri::command]
async fn start_sync(sync_dir: String, api_url: String) -> Result<String, String> {
    let sync_manager = SyncManager::new(
        api_url,
        PathBuf::from(sync_dir.clone()),
    );

    sync_manager.initial_sync().await
        .map_err(|e| e.to_string())?;

    tokio::spawn(async move {
        if let Err(e) = sync_manager.watch_directory().await {
            log::error!("Sync error: {}", e);
        }
    });

    Ok(format!("Sync started in: {}", sync_dir))
}

#[tauri::command]
fn get_default_sync_dir() -> Result<String, String> {
    let home_dir = dirs::home_dir()
        .ok_or("Could not find home directory")?;
    let sync_dir = home_dir.join("FrankDrive-Sync");
    Ok(sync_dir.to_string_lossy().to_string())
}

#[tauri::command]
fn save_file_selection(sync_dir: String, ignored_files: Vec<String>) -> Result<String, String> {
    use std::fs;
    use std::path::PathBuf;
    
    let sync_path = PathBuf::from(&sync_dir);
    if !sync_path.exists() {
        fs::create_dir_all(&sync_path)
            .map_err(|e| format!("Failed to create sync dir: {}", e))?;
    }
    
    let ignore_file = sync_path.join(".frankdrive-ignore");
    let content = ignored_files.join("\n");
    
    fs::write(&ignore_file, content)
        .map_err(|e| format!("Failed to write ignore file: {}", e))?;
    
    Ok(format!("Saved selection: {} files ignored", ignored_files.len()))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![start_sync, get_default_sync_dir, save_file_selection])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
