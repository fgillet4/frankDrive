use notify::{Watcher, RecursiveMode, RecommendedWatcher};
use std::path::{Path, PathBuf};
use std::sync::mpsc::channel;
use std::time::Duration;
use tokio::fs;
use walkdir::WalkDir;
use reqwest::Client;
use serde::{Deserialize, Deserializer, Serialize};

fn deserialize_string_to_i64<'de, D>(deserializer: D) -> Result<i64, D::Error>
where
    D: Deserializer<'de>,
{
    let s: serde_json::Value = Deserialize::deserialize(deserializer)?;
    match s {
        serde_json::Value::Number(n) => n.as_i64().ok_or_else(|| serde::de::Error::custom("invalid number")),
        serde_json::Value::String(s) => s.parse::<i64>().map_err(serde::de::Error::custom),
        _ => Err(serde::de::Error::custom("expected number or string")),
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    pub id: String,
    pub name: String,
    #[serde(deserialize_with = "deserialize_string_to_i64")]
    pub size: i64,
    #[serde(rename = "mimeType")]
    pub mime_type: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
struct FilesResponse {
    files: Vec<FileMetadata>,
}

pub struct SyncManager {
    api_url: String,
    sync_dir: PathBuf,
    client: Client,
}

impl SyncManager {
    pub fn new(api_url: String, sync_dir: PathBuf) -> Self {
        Self {
            api_url,
            sync_dir,
            client: Client::new(),
        }
    }

    pub async fn initialize_sync_dir(&self) -> Result<(), Box<dyn std::error::Error>> {
        if !self.sync_dir.exists() {
            fs::create_dir_all(&self.sync_dir).await?;
            log::info!("Created sync directory: {:?}", self.sync_dir);
        }
        Ok(())
    }

    pub async fn download_all_files(&self) -> Result<(), Box<dyn std::error::Error>> {
        let url = format!("{}/api/files", self.api_url);
        let response = self.client.get(&url).send().await?;
        
        if !response.status().is_success() {
            return Err(format!("Failed to fetch files: {}", response.status()).into());
        }

        let files_response: FilesResponse = response.json().await?;
        
        for file in files_response.files {
            self.download_file(&file).await?;
        }

        Ok(())
    }

    async fn download_file(&self, file: &FileMetadata) -> Result<(), Box<dyn std::error::Error>> {
        let download_url = format!("{}/api/files/{}/download", self.api_url, file.id);
        let response = self.client.get(&download_url).send().await?;
        
        if !response.status().is_success() {
            return Err(format!("Failed to download file: {}", response.status()).into());
        }

        let file_path = self.sync_dir.join(&file.name);
        let bytes = response.bytes().await?;
        fs::write(&file_path, bytes).await?;
        
        log::info!("Downloaded file: {:?}", file_path);
        Ok(())
    }

    pub async fn upload_file(&self, file_path: &Path) -> Result<(), Box<dyn std::error::Error>> {
        let file_name = file_path
            .file_name()
            .and_then(|n| n.to_str())
            .ok_or("Invalid file name")?;

        let file_bytes = fs::read(file_path).await?;
        
        let form = reqwest::multipart::Form::new()
            .part("file", reqwest::multipart::Part::bytes(file_bytes)
                .file_name(file_name.to_string()));

        let upload_url = format!("{}/api/files/upload", self.api_url);
        let response = self.client
            .post(&upload_url)
            .multipart(form)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(format!("Failed to upload file: {}", response.status()).into());
        }

        log::info!("Uploaded file: {:?}", file_path);
        Ok(())
    }

    pub async fn watch_directory(&self) -> Result<(), Box<dyn std::error::Error>> {
        let (tx, rx) = channel();

        let mut watcher: RecommendedWatcher = Watcher::new(
            tx,
            notify::Config::default().with_poll_interval(Duration::from_secs(2))
        )?;

        watcher.watch(&self.sync_dir, RecursiveMode::Recursive)?;

        log::info!("Watching directory: {:?}", self.sync_dir);

        for event in rx {
            match event {
                Ok(event) => {
                    log::info!("File event: {:?}", event);
                    
                    for path in event.paths {
                        let path_str = path.to_string_lossy();
                        
                        if path.is_file() 
                            && !path_str.contains("minio-data")
                            && !path_str.contains("postgres-data")
                            && !path_str.contains("redis-data")
                            && !path_str.contains(".git")
                            && !path_str.contains("node_modules")
                            && !path_str.contains(".DS_Store")
                            && !path.file_name().unwrap_or_default().to_string_lossy().starts_with('.') 
                        {
                            match event.kind {
                                notify::EventKind::Create(_) | notify::EventKind::Modify(_) => {
                                    if let Err(e) = self.upload_file(&path).await {
                                        log::error!("Failed to upload file: {}", e);
                                    }
                                }
                                _ => {}
                            }
                        }
                    }
                }
                Err(e) => log::error!("Watch error: {:?}", e),
            }
        }

        Ok(())
    }

    pub async fn initial_sync(&self) -> Result<(), Box<dyn std::error::Error>> {
        self.initialize_sync_dir().await?;
        
        self.download_all_files().await?;
        
        for entry in WalkDir::new(&self.sync_dir).into_iter().filter_map(|e| e.ok()) {
            if entry.path().is_file() {
                let file_name = entry.file_name().to_string_lossy();
                if !file_name.starts_with('.') {
                    log::info!("Local file ready: {:?}", entry.path());
                }
            }
        }

        Ok(())
    }
}
