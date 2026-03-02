# FrankDrive

An open-source OneDrive clone built with modern technologies.

## Tech Stack

### Backend
- **Node.js + Fastify** - Fast, efficient API server
- **PostgreSQL** - Relational database for metadata
- **Redis** - Session management and caching
- **MinIO** - S3-compatible object storage
- **Prisma** - Type-safe database ORM
- **BullMQ** - Background job processing

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **TanStack Query** - Data fetching and caching
- **Zustand** - State management

### Infrastructure
- **Docker Compose** - Local development
- **Turbo** - Monorepo build system
- **pnpm** - Fast, efficient package manager

## Project Structure

```
frankdrive/
├── apps/
│   ├── backend/          # Fastify API server
│   │   ├── src/
│   │   │   ├── routes/   # API routes
│   │   │   ├── services/ # Business logic
│   │   │   └── index.ts  # Entry point
│   │   └── prisma/       # Database schema
│   └── web/              # Next.js frontend
│       └── src/
│           ├── app/      # App router pages
│           └── components/
├── packages/
│   └── shared/           # Shared types and schemas
├── docker-compose.yml    # Development services
└── turbo.json           # Monorepo config
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

### Installation

1. Clone the repository:
```bash
cd frankdrive
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Start Docker services (PostgreSQL, Redis, MinIO):
```bash
pnpm docker:up
```

5. Run database migrations:
```bash
cd apps/backend
pnpm prisma migrate dev
```

6. Start development servers:
```bash
pnpm dev
```

This will start:
- Backend API: http://localhost:3001
- Frontend: http://localhost:3000
- MinIO Console: http://localhost:9001

### Access Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **MinIO Console**: http://localhost:9001
  - Username: `frankdrive_minio`
  - Password: `frankdrive_minio_password`

## Development

### Running Commands

```bash
pnpm dev          # Start all apps in dev mode
pnpm build        # Build all apps
pnpm lint         # Lint all apps
pnpm clean        # Clean all build artifacts
pnpm docker:up    # Start Docker services
pnpm docker:down  # Stop Docker services
pnpm docker:logs  # View Docker logs
```

### Database Management

```bash
cd apps/backend

npx prisma migrate dev     # Create and apply migration
npx prisma studio          # Open Prisma Studio
npx prisma generate        # Generate Prisma Client
```

## Features Roadmap

- [ ] User authentication & authorization
- [ ] File upload with chunking (tus.io protocol)
- [ ] Folder management
- [ ] File sharing with permissions
- [ ] File versioning
- [ ] Real-time sync with WebSockets
- [ ] Full-text search (Meilisearch)
- [ ] Thumbnail generation
- [ ] Desktop sync client (Rust + Tauri)
- [ ] Mobile apps
- [ ] Trash/Recovery
- [ ] Activity feed

## Architecture

### File Storage Flow

1. Client requests upload URL from backend
2. Backend generates presigned MinIO URL
3. Client uploads directly to MinIO (chunked)
4. Backend saves metadata to PostgreSQL
5. Background jobs process thumbnails, virus scanning

### Authentication

- JWT-based authentication
- Session stored in Redis
- Refresh token rotation

### Permissions

- Owner, Admin, Write, Read levels
- Cascading folder permissions
- Expiring share links

## Contributing

Contributions welcome! Please read our contributing guidelines.

## License

MIT License - see LICENSE file for details.
