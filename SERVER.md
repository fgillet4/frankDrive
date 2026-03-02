# FrankDrive — Mac Mini Server

**Host:** `frankstation.local` / `192.168.1.70`
**External:** `81.236.18.103:2223`

---

## Services

| Service      | Port  | Auto-starts |
|--------------|-------|-------------|
| PostgreSQL   | 5432  | ✅ brew service |
| Redis        | 6379  | ✅ brew service |
| MinIO        | 9000  | ✅ launchd |
| MinIO Console| 9001  | ✅ launchd |
| Backend API  | 4000  | ✅ launchd |

Everything starts automatically on login. No manual action needed after reboot.

---

## Health Check

```bash
curl http://localhost:4000/health
```

From another device:
```bash
curl http://frankstation.local:4000/health
```

---

## Start Everything (if something is down)

```bash
/opt/homebrew/bin/brew services start postgresql@14
/opt/homebrew/bin/brew services start redis
launchctl load ~/Library/LaunchAgents/frankdrive.minio.plist
launchctl load ~/Library/LaunchAgents/frankdrive.backend.plist
```

## Stop Everything

```bash
launchctl unload ~/Library/LaunchAgents/frankdrive.backend.plist
launchctl unload ~/Library/LaunchAgents/frankdrive.minio.plist
/opt/homebrew/bin/brew services stop redis
/opt/homebrew/bin/brew services stop postgresql@14
```

## Restart Backend Only

```bash
launchctl unload ~/Library/LaunchAgents/frankdrive.backend.plist
launchctl load ~/Library/LaunchAgents/frankdrive.backend.plist
```

## Force Restart Backend (stale process / port 4000 in use)

Use this if backend keeps crashing with `EADDRINUSE: address already in use 0.0.0.0:4000`:

```bash
pkill -f "tsx watch src/index.ts" && sleep 2 && launchctl unload ~/Library/LaunchAgents/frankdrive.backend.plist && launchctl load ~/Library/LaunchAgents/frankdrive.backend.plist
```

---

## Logs

```bash
# Live backend output
tail -f ~/frankDrive/logs/backend.log

# Backend errors
tail -f ~/frankDrive/logs/backend.error.log

# MinIO output
tail -f ~/frankDrive/logs/minio.log
```

---

## Check Service Status

```bash
# Brew services (postgres, redis)
/opt/homebrew/bin/brew services list

# Launchd services (minio, backend)
launchctl list | grep frankdrive
```

---

## Reach From Other Devices (local network)

| What           | URL                                  |
|----------------|--------------------------------------|
| API health     | http://frankstation.local:4000/health |
| Backend API    | http://frankstation.local:4000        |
| MinIO Console  | http://frankstation.local:9001        |

MinIO Console login: `frankdrive_minio` / `frankdrive_minio_password`

---

## Data Locations

| Data         | Path                              |
|--------------|-----------------------------------|
| Files        | `~/minio-data/`                   |
| Database     | `/opt/homebrew/var/postgresql@14/`|
| Logs         | `~/frankDrive/logs/`              |
| Backend env  | `~/frankDrive/apps/backend/.env`  |

---

## SSH In From MacBook Air

```bash
ssh mac-mini-local     # local network
ssh mac-mini-remote    # over internet
```
