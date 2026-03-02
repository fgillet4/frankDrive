# FrankDrive Server Setup (Mac Mini)

**Mac Mini:** `frankstation.local` / `192.168.1.70`
**External:** `81.236.18.103:2223` (SSH only, no Docker)

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│         Mac Mini (frankstation.local)           │
│                                                 │
│  brew services (auto-start):                    │
│  ├─ PostgreSQL (5432)                           │
│  ├─ Redis (6379)                                │
│                                                 │
│  launchd (auto-start):                          │
│  ├─ MinIO file storage (9000-9001)              │
│  └─ Backend API (4000) ← clients connect here  │
└─────────────────────────────────────────────────┘
                    ▲
                    │ http://frankstation.local:4000
                    │
          ┌─────────┴──────────┐
    ┌─────┴──────┐      ┌──────┴──────┐
    │ MacBook Air│      │Other Device │
    │ Tauri app  │      │ Tauri app   │
    │ ~/FrankDrive-Sync │ ~/FrankDrive-Sync
    └────────────┘      └─────────────┘
```

---

## Mac Mini — Nothing to do

All services auto-start on login via launchd/brew services:

| Service    | Port | Managed by   |
|------------|------|--------------|
| PostgreSQL | 5432 | brew service |
| Redis      | 6379 | brew service |
| MinIO      | 9000 | launchd      |
| Backend    | 4000 | launchd      |

**After a reboot → everything comes back automatically.**

### Verify everything is running

```bash
curl http://localhost:4000/health
# → {"status":"ok"}
```

### If something is down, restart manually

```bash
/opt/homebrew/bin/brew services start postgresql@14
/opt/homebrew/bin/brew services start redis
launchctl load ~/Library/LaunchAgents/frankdrive.minio.plist
launchctl load ~/Library/LaunchAgents/frankdrive.backend.plist
```

### Logs

```bash
tail -f ~/frankDrive/logs/backend.log
tail -f ~/frankDrive/logs/backend.error.log
tail -f ~/frankDrive/logs/minio.log
```

---

## MacBook Air (Tauri Desktop App)

### First time setup

```bash
cd ~/frankDrive
pnpm install
```

### Every time — run these two terminals

**Terminal 1** (Vite dev server):
```bash
cd ~/frankDrive/apps/desktop
pnpm dev
```

**Terminal 2** (after Vite is ready):
```bash
cd ~/frankDrive/apps/desktop
pnpm tauri:dev
```

### In the app

- **Sync Folder:** `~/FrankDrive` (or whatever you want)
- **API URL:** `http://frankstation.local:4000`
- Click **Start Syncing**

---

## Test the connection from MacBook Air

```bash
curl http://frankstation.local:4000/health
# → {"status":"ok"}
```

---

## URLs (local network)

| What           | URL                                    |
|----------------|----------------------------------------|
| Health check   | http://frankstation.local:4000/health  |
| Backend API    | http://frankstation.local:4000         |
| MinIO Console  | http://frankstation.local:9001         |

MinIO login: `frankdrive_minio` / `frankdrive_minio_password`

---

## Troubleshooting

**Can't reach server from MacBook Air:**
```bash
ping frankstation.local          # check name resolves
curl http://192.168.1.70:4000/health  # try IP directly
```

**Backend down on Mac Mini:**
```bash
launchctl list | grep frankdrive   # check status
tail -f ~/frankDrive/logs/backend.error.log
# restart:
launchctl unload ~/Library/LaunchAgents/frankdrive.backend.plist
launchctl load ~/Library/LaunchAgents/frankdrive.backend.plist
```
