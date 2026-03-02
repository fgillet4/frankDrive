# FrankDrive Desktop

Desktop sync client for FrankDrive built with Tauri + Rust.

## Features

- **Automatic File Sync**: Watches a local folder and syncs files to FrankDrive cloud
- **Bidirectional Sync**: Downloads all cloud files to local folder on startup
- **Real-time Upload**: Automatically uploads new/modified files to the cloud
- **Native Performance**: Built with Rust and Tauri for minimal resource usage
- **Cross-Platform**: Works on macOS, Windows, and Linux

## Architecture

### Rust Backend (`src-tauri/`)
- **`sync.rs`**: File sync manager with:
  - `SyncManager`: Handles all sync operations
  - `download_all_files()`: Initial download of all cloud files
  - `upload_file()`: Uploads local files to cloud
  - `watch_directory()`: File system watcher for real-time sync
  
- **`lib.rs`**: Tauri commands:
  - `start_sync()`: Initializes sync with API URL and local folder
  - `get_default_sync_dir()`: Returns `~/FrankDrive` as default sync location

### Frontend (`index.html`)
- Simple UI to configure sync folder and API URL
- Invokes Tauri commands to start syncing

## Requirements

- Rust 1.77.2+ (installed via Homebrew)
- Node.js 18+ with pnpm
- FrankDrive backend running at http://localhost:4000

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm tauri:dev
```

This will:
1. Start Vite dev server on port 5173
2. Compile Rust code
3. Launch the desktop app

## Usage

1. Launch the app
2. Default sync folder is `~/FrankDrive` (auto-created)
3. Set API URL (default: `http://localhost:4000`)
4. Click "Start Syncing"

The app will:
- Create sync folder if it doesn't exist
- Download all files from cloud to `~/FrankDrive`
- Watch folder for changes and upload new/modified files automatically

## Finder Integration

Once synced, the `~/FrankDrive` folder appears in:
- **Finder sidebar**: Add to Favorites by dragging folder to sidebar
- **Terminal**: `cd ~/FrankDrive`
- **Any app**: Files are real local files, accessible anywhere

## Build

```bash
# Build production app
pnpm tauri:build
```

Creates platform-specific installer in `src-tauri/target/release/bundle/`

## Dependencies

### Rust
- `tauri`: Desktop app framework
- `notify`: File system watcher
- `tokio`: Async runtime
- `reqwest`: HTTP client for API calls
- `walkdir`: Directory traversal
- `dirs`: Cross-platform directory paths

### JavaScript
- `@tauri-apps/api`: Tauri JavaScript bindings
- `vite`: Frontend dev server

## API Integration

Connects to FrankDrive backend endpoints:
- `GET /api/files` - List all files
- `GET /api/files/:id/download` - Download file
- `POST /api/files/upload` - Upload file

## TODO

- [ ] Two-way sync (detect cloud changes and download)
- [ ] Conflict resolution
- [ ] System tray icon
- [ ] Pause/resume sync
- [ ] Selective sync (choose which files to sync)
- [ ] File deletion sync
