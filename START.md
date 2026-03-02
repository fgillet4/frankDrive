# FrankDrive - How to Start

You need to run **4 separate terminals** to run the full FrankDrive stack:

## Terminal 1: Docker Services (PostgreSQL, Redis, MinIO)

```bash
cd ~/frankDrive
docker compose up
```

This starts:
- **PostgreSQL** on port 5433
- **Redis** on port 6379
- **MinIO** (S3 storage) on ports 9000-9001

Keep this running. You'll see logs from all 3 services.

---

## Terminal 2: Backend API (Fastify)

```bash
cd ~/frankDrive/apps/backend
pnpm dev
```

This starts:
- **Fastify server** on http://localhost:4000
- Handles file upload/download/delete/rename
- Connects to PostgreSQL, Redis, MinIO

Look for: `🚀 Server running on http://localhost:4000`

---

## Terminal 3: Web Frontend (Next.js)

```bash
cd ~/frankDrive/apps/web
pnpm dev -- -p 4001
```

This starts:
- **Next.js app** on http://localhost:4001
- Web UI for file management (grid/list view, drag-drop upload)
- OneDrive-style interface

Look for: `✓ Ready in...` then open http://localhost:4001 in browser

---

## Terminal 4a: Desktop App - Vite Server

```bash
cd ~/frankDrive/apps/desktop
pnpm dev
```

This starts:
- **Vite dev server** on http://localhost:5173
- Serves the desktop app UI (simple sync config page)

Look for: `➜  Local:   http://localhost:5173/`

---

## Terminal 4b: Desktop App - Tauri (Run AFTER 4a)

**Wait for Vite to start in Terminal 4a first!** Then in a 5th terminal:

```bash
cd ~/frankDrive/apps/desktop
pnpm tauri:dev
```

This:
- Compiles Rust code (first time takes ~2 minutes)
- Launches native desktop app window
- Connects to Vite on port 5173
- Creates `~/FrankDrive` sync folder

Look for: Desktop window opens with sync configuration UI

---

## Quick Start Order

1. **Terminal 1**: `docker compose up` (wait for all 3 services)
2. **Terminal 2**: `cd apps/backend && pnpm dev` (wait for "Server running")
3. **Terminal 3**: `cd apps/web && pnpm dev -- -p 4001` (open http://localhost:4001)
4. **Terminal 4a**: `cd apps/desktop && pnpm dev` (wait for Vite ready)
5. **Terminal 4b**: `cd apps/desktop && pnpm tauri:dev` (desktop app launches)

---

## What Each Does

| Component | Port | Purpose |
|-----------|------|---------|
| PostgreSQL | 5433 | Database for file metadata |
| Redis | 6379 | Caching (future) |
| MinIO | 9000-9001 | S3-compatible file storage |
| Backend API | 4000 | REST API for file operations |
| Web UI | 4001 | Browser-based file manager |
| Vite (Desktop) | 5173 | Desktop app frontend |
| Tauri | - | Native desktop sync client |

---

## Using the Apps

### Web UI (http://localhost:4001)
- Upload files via drag-drop or click
- View in grid or list mode
- Right-click files to rename, download, or delete
- See thumbnails for images

### Desktop App (Native Window)
1. App opens with default sync folder: `~/FrankDrive`
2. API URL pre-filled: `http://localhost:4000`
3. Click "Start Syncing"
4. All cloud files download to `~/FrankDrive`
5. Any file added to `~/FrankDrive` auto-uploads to cloud
6. Check Finder - `~/FrankDrive` folder is now synced!

---

## Stopping Everything

Press `Ctrl+C` in each terminal to stop services.

Or kill all at once:
```bash
pkill -f "docker compose"
pkill -f "pnpm dev"
pkill -f "tauri dev"
```

---

## Troubleshooting

**"Port already in use"**
- Backend: Something on port 4000 - kill it or change PORT in `apps/backend/.env`
- Web: Something on port 4001 - use different port: `pnpm dev -- -p 4002`

**"Connection refused" in backend logs**
- Docker services not running - start Terminal 1 first

**Tauri stuck on "Waiting for frontend dev server"**
- Vite (Terminal 4a) not running - start it first, wait for "Local: http://localhost:5173"

**Desktop app won't compile**
- Need Rust: `brew install rust` (already installed)
- First compile takes 2-3 minutes, be patient

**Files not syncing**
- Backend must be running (Terminal 2)
- Check API URL in desktop app matches backend (http://localhost:4000)
