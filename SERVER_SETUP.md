# FrankDrive Server Setup (Mac Mini)

**Goal**: Run the backend services on your headless Mac Mini so you can access FrankDrive from any device on your network.

---

## What Runs Where

### Mac Mini Server (frankstation.local / 81.236.18.103:2223)
**Run these 4 services:**
1. **Docker Services** (PostgreSQL, Redis, MinIO)
2. **Backend API** (Fastify on port 4000)
3. **Web UI** (Next.js on port 4001) - optional, for browser access
4. **~~Desktop App~~** - NO, only run on client machines

### Client Machines (MacBook Air, other devices)
**Run only:**
- **Desktop App** (Tauri) - syncs to `~/FrankDrive-Sync`

---

## Server Setup (Mac Mini)

### 1. Install Dependencies

```bash
# SSH into Mac Mini
ssh mac-mini-local
# or
ssh mac-mini-remote

# Install Node.js and pnpm (if not installed)
brew install node pnpm

# Install Rust (NOT needed for server - only for Tauri development)
# Skip this on the server

# Install Docker (if not installed)
brew install docker
brew install docker-compose
```

### 2. Clone and Setup FrankDrive

```bash
cd ~
git clone <your-frankdrive-repo>
cd frankDrive

# Install dependencies
pnpm install
```

### 3. Configure Backend Environment

```bash
cd ~/frankDrive/apps/backend
cp .env.example .env
# Edit .env with server IP
nano .env
```

**Update `.env` to allow network access:**
```env
DATABASE_URL=postgresql://postgres:frankdrive_dev_password@127.0.0.1:5433/frankdrive
PORT=4000
# Allow all origins for network access
FRONTEND_URL=*
# Or specific IPs:
# FRONTEND_URL=http://192.168.1.78,http://frankstation.local:4001
```

### 4. Start Services (Production-like)

Create a startup script:

```bash
nano ~/frankDrive/start-server.sh
```

Add this:
```bash
#!/bin/bash

# Start Docker services
cd ~/frankDrive
docker compose up -d

# Wait for databases
sleep 5

# Start backend
cd ~/frankDrive/apps/backend
pnpm dev &

# Start web UI (optional)
cd ~/frankDrive/apps/web
pnpm dev -- -p 4001 &

echo "FrankDrive server started!"
echo "Backend: http://frankstation.local:4000"
echo "Web UI: http://frankstation.local:4001"
```

Make it executable:
```bash
chmod +x ~/frankDrive/start-server.sh
```

Run it:
```bash
~/frankDrive/start-server.sh
```

### 5. Make it Auto-Start on Boot (Optional)

Create a LaunchAgent:
```bash
nano ~/Library/LaunchAgents/com.frankdrive.server.plist
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.frankdrive.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/francisgillet/frankDrive/start-server.sh</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/francisgillet/frankDrive/server.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/francisgillet/frankDrive/server.error.log</string>
</dict>
</plist>
```

Load it:
```bash
launchctl load ~/Library/LaunchAgents/com.frankdrive.server.plist
```

---

## Client Setup (MacBook Air)

### 1. Clone FrankDrive

```bash
cd ~
git clone <your-frankdrive-repo>
cd frankDrive
pnpm install
```

### 2. Update Desktop App to Point to Server

Edit `~/frankDrive/apps/desktop/index.html`:

Change the default API URL from `http://localhost:4000` to your server:

```html
<!-- Find this line and change it -->
<input type="url" id="apiUrl" value="http://frankstation.local:4000" required />
```

Or just enter it manually in the app when it opens.

### 3. Run Desktop App Only

```bash
cd ~/frankDrive/apps/desktop

# Terminal 1: Start Vite
pnpm dev

# Terminal 2: Start Tauri (after Vite is ready)
pnpm tauri:dev
```

### 4. Configure Sync

When the desktop app opens:
1. **Sync Folder**: Keep default `~/FrankDrive-Sync`
2. **API URL**: Enter `http://frankstation.local:4000`
   - For local network: `http://frankstation.local:4000` or `http://192.168.1.70:4000`
   - For remote access: `http://81.236.18.103:4000` (if port forwarded)
3. Click "Start Syncing"

---

## Network Access

### Local Network URLs

From any device on your network:

- **Backend API**: `http://frankstation.local:4000`
- **Web UI**: `http://frankstation.local:4001`
- **MinIO Console**: `http://frankstation.local:9001`
- **Health Check**: `http://frankstation.local:4000/health`

### Remote Access (Outside Network)

You mentioned external IP `81.236.18.103:2223` - you'll need to:

1. **Port Forward on Router**:
   - Forward port 4000 → Mac Mini port 4000 (Backend)
   - Forward port 4001 → Mac Mini port 4001 (Web UI)

2. **Update Desktop App**:
   - API URL: `http://81.236.18.103:4000`

---

## Testing the Setup

### On Mac Mini Server

```bash
# Check Docker services
docker ps

# Check backend
curl http://localhost:4000/health

# Check if accessible from network
curl http://frankstation.local:4000/health
```

### On MacBook Air

```bash
# Test connection to server
curl http://frankstation.local:4000/health

# Should return:
# {"status":"ok"}
```

---

## Architecture Summary

```
┌─────────────────────────────────────────────────┐
│         Mac Mini Server (frankstation.local)    │
│                                                 │
│  Docker:                                        │
│  ├─ PostgreSQL (5433)                           │
│  ├─ Redis (6379)                                │
│  └─ MinIO (9000-9001)                           │
│                                                 │
│  Node.js:                                       │
│  ├─ Backend API (4000) ← Clients connect here  │
│  └─ Web UI (4001) ← Optional browser access     │
└─────────────────────────────────────────────────┘
                    ▲
                    │ HTTP API calls
                    │
    ┌───────────────┴───────────────┐
    │                               │
┌───┴────────┐              ┌──────┴─────┐
│ MacBook Air│              │ Other Device│
│            │              │             │
│  Tauri App │              │  Tauri App  │
│     ↓      │              │      ↓      │
│  ~/FrankDrive-Sync        │  ~/FrankDrive-Sync
└────────────┘              └─────────────┘
```

---

## Key Points

✅ **Server runs**: Docker + Backend + Web UI  
✅ **Clients run**: Tauri Desktop App only  
✅ **No Rust needed on server** - only on machines where you develop/run Tauri  
✅ **Clients connect to**: `http://frankstation.local:4000`  
✅ **Files sync to**: `~/FrankDrive-Sync` on each client  

---

## Troubleshooting

**Can't reach server from client:**
- Check firewall on Mac Mini: System Settings → Network → Firewall
- Verify Mac Mini IP: `ifconfig | grep "inet "`
- Ping server: `ping frankstation.local`

**Backend not responding:**
- Check logs: `docker logs frankdrive-postgres-1`
- Check backend process: `ps aux | grep node`
- Restart: `pkill -f "pnpm dev" && ~/frankDrive/start-server.sh`

**Desktop app won't connect:**
- Verify API URL in app matches server
- Test health endpoint: `curl http://frankstation.local:4000/health`
- Check CORS settings in `apps/backend/src/index.ts`
