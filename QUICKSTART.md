# Quick Start Guide

Get the development environment up and running in minutes.

## Prerequisites

- **Docker & Docker Compose** - [Install](https://docs.docker.com/get-docker/)
- **Git** - For version control
- **Node.js 18+** - Optional, for local testing (Docker containers include Node)

## 1. Clone & Setup

```bash
# Clone the repository
git clone <repository-url>
cd project

# Copy environment configuration
cp .env.example .env

# (Optional) Create local override
cp .env.local.example .env.local
```

## 2. Start Services

### Option A: Using Script (Recommended)

```bash
./scripts/start-services.sh local
```

### Option B: Using Makefile

```bash
make start
```

### Option C: Direct Docker Compose

```bash
docker compose up -d
```

## 3. Run Database Migrations

```bash
./scripts/run_migrations.sh local
```

Or using Makefile:

```bash
make migrate
```

## 4. Access the Application

| Service | URL | Credentials |
|---------|-----|-------------|
| Web UI | http://localhost:3000 | N/A |
| API | http://localhost:3001 | N/A |
| API Health | http://localhost:3001/health | N/A |
| PostgreSQL | localhost:5432 | postgres/postgres |
| Redis | localhost:6379 | N/A |

## 5. Common Commands

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f web
docker compose logs -f postgres
```

### Stop Services

```bash
docker compose down
```

### Clean Everything (Remove Data)

```bash
docker compose down -v
```

### Run Tests

```bash
make test
```

### Run Linting

```bash
make lint
```

### Run Type Checking

```bash
make type-check
```

## Environment Configuration

The `.env` file contains important configuration:

```env
# Database
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=monorepo
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/monorepo

# Redis
REDIS_URL=redis://localhost:6379

# API
API_PORT=3001
JWT_ACCESS_SECRET=dev-secret-key

# Web
WEB_PORT=3000
VITE_API_URL=http://localhost:3001
```

### Customization

To use different ports or credentials:

1. Edit `.env`
2. Restart services: `docker compose restart`

Or for local-only overrides, create `.env.local` (ignored by git).

## Troubleshooting

### Services Won't Start

```bash
# Check if ports are in use
lsof -i :3000  # Web
lsof -i :3001  # API
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Kill process using port (if needed)
kill -9 <PID>
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running and healthy
docker compose ps postgres

# Check logs
docker compose logs postgres

# Verify connection
docker compose exec postgres psql -U postgres -d monorepo -c "SELECT 1;"
```

### API Service Crashing

```bash
# Check API logs
docker compose logs api

# Restart API
docker compose restart api

# Rebuild API image
docker compose build api
```

### Need to Reset Database

```bash
# Stop and remove volumes
docker compose down -v

# Start fresh
docker compose up -d

# Run migrations again
./scripts/run_migrations.sh local
```

## Next Steps

- Review [`docs/deployment-guide.md`](docs/deployment-guide.md) for detailed deployment information
- Check [`docs/database-migrations.md`](docs/database-migrations.md) for database schema changes
- See [`README.md`](README.md) for full project documentation

## Docker Compose Services

### PostgreSQL
- Image: postgres:15-alpine
- Port: 5432
- Volume: postgres_data (persistent)
- Health: Checked via `pg_isready`

### Redis
- Image: redis:7-alpine
- Port: 6379
- Volume: redis_data (persistent)
- Health: Checked via `redis-cli ping`

### API
- Port: 3001
- Auto-reload: Enabled (for development)
- Depends on: PostgreSQL, Redis
- Hot-reload watch enabled

### Web
- Port: 3000
- Auto-reload: Enabled (for development)
- Depends on: API service

## Tips

1. **Keep services running:** Leave `docker compose` running in a terminal tab
2. **Watch logs live:** Use `docker compose logs -f` to monitor in real-time
3. **Fast restart:** Run `docker compose down && docker compose up -d`
4. **Database backup:** Before major changes, backup with `docker compose exec postgres pg_dump -U postgres monorepo > backup.sql`

## Getting Help

- Check logs: `docker compose logs -f <service>`
- Review documentation: See `docs/` directory
- Check configurations: Review `.env` file
- Run tests: `make test`

## Development Workflow

```bash
# Terminal 1: Watch logs
docker compose logs -f

# Terminal 2: Run development
docker compose up -d

# Terminal 3: Use API/Web
curl http://localhost:3001/health
```

---

**Happy coding!** 🚀
