# FrankDrive — Port Map

## Mac Mini (frankstation.local / 192.168.1.70)

| Port | Service       | Access        | Notes                        |
|------|---------------|---------------|------------------------------|
| 5432 | PostgreSQL    | internal only | managed by brew service      |
| 6379 | Redis         | internal only | managed by brew service      |
| 9000 | MinIO API     | internal only | file storage S3 API          |
| 9001 | MinIO Console | local network | http://frankstation.local:9001 |
| 4000 | Backend API   | local network | http://frankstation.local:4000 |
| 4001 | Web UI        | local network | http://frankstation.local:4001 |

## MacBook Air (francisbrain4-3 / 192.168.1.78)

| Port | Service        | Notes                        |
|------|----------------|------------------------------|
| 5173 | Vite (desktop) | Tauri dev server, local only |

## External (router 81.236.18.103)

| Port | Forwards to              | Notes              |
|------|--------------------------|--------------------|
| 2223 | Mac Mini :22             | SSH access         |

## Reserved / Do Not Use

| Port | Reason                  |
|------|-------------------------|
| 3000 | Next.js default         |
| 3001 | common dev default      |
| 5173 | Vite default            |
| 8080 | common HTTP alt         |
