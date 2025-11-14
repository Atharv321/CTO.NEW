# DevOps Stack Configuration

Complete configuration of the DevOps stack with Docker Compose, PostgreSQL, Redis, migrations, CI/CD pipeline, and deployment guidelines.

## Overview

This document summarizes all the DevOps configurations implemented for the monorepo project, including:
- Local development environment with Docker Compose
- PostgreSQL and Redis services
- Database migration scripts
- GitHub Actions CI/CD pipeline
- Environment-specific configurations
- Logs management and secrets handling
- Production deployment considerations

## 1. Docker Compose Stack

### Services Configured

#### PostgreSQL (Database)
- **Image:** postgres:15-alpine
- **Container:** monorepo-postgres
- **Port:** 5432 (configurable via `DB_PORT`)
- **Credentials:** 
  - User: postgres (configurable via `DB_USER`)
  - Password: postgres (configurable via `DB_PASSWORD`)
  - Database: monorepo (configurable via `DB_NAME`)
- **Volume:** postgres_data (persistent storage)
- **Health Check:** pg_isready enabled
- **Network:** monorepo-network (bridge)

#### Redis (Cache)
- **Image:** redis:7-alpine
- **Container:** monorepo-redis
- **Port:** 6379 (configurable via `REDIS_PORT`)
- **Volume:** redis_data (persistent storage)
- **Health Check:** redis-cli ping enabled
- **Network:** monorepo-network (bridge)

#### API Service
- **Build Context:** ./api
- **Container:** monorepo-api
- **Port:** 3001 (configurable via `API_PORT`)
- **Dependencies:** PostgreSQL, Redis (health checks enforced)
- **Auto-reload:** Enabled for development
- **Environment Variables:**
  - NODE_ENV: development
  - DATABASE_URL: Auto-configured
  - REDIS_URL: Auto-configured
  - JWT secrets and expiration times

#### Web Service
- **Build Context:** ./web
- **Container:** monorepo-web
- **Port:** 3000 (configurable via `WEB_PORT`)
- **Depends On:** API service
- **Auto-reload:** Enabled for development
- **Environment Variables:**
  - VITE_API_URL: API endpoint (configurable)

### Network

All services communicate through:
- **Network Name:** monorepo-network
- **Type:** Bridge network
- **Isolation:** Services can communicate by container name

### Volumes

Data persistence:
- **postgres_data** - PostgreSQL data files
- **redis_data** - Redis data files
- Both use local driver for development

## 2. Environment Configuration Files

### `.env.example`
Default development environment configuration. Use as template for local setup.

**Location:** `/home/engine/project/.env.example`

**Variables:**
- Database (DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, DATABASE_URL)
- Redis (REDIS_PORT, REDIS_URL)
- API (API_PORT)
- Web (WEB_PORT, VITE_API_URL)
- Authentication (JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN)

### `.env.local.example`
Local development overrides. Ignored by git.

**Location:** `/home/engine/project/.env.local.example`

**Use Case:** Customize settings without affecting other developers

### `.env.staging.example`
Staging environment template.

**Location:** `/home/engine/project/.env.staging.example`

**Variables:** Placeholders for:
- Staging database credentials
- Staging Redis connection
- Staging JWT secrets
- Staging API URL

**Note:** Set actual values via GitHub Secrets

### `.env.production.example`
Production environment template.

**Location:** `/home/engine/project/.env.production.example`

**Critical:** 
- Never commit actual production secrets
- Use GitHub Secrets for CI/CD
- Different secrets per environment

## 3. Scripts

### `scripts/start-services.sh`
**Purpose:** Start Docker Compose services with automatic setup

**Usage:**
```bash
./scripts/start-services.sh local
```

**Features:**
- Auto-creates .env if missing
- Starts services in detached mode (configurable)
- Displays service URLs
- Instructions for viewing logs

**Options:**
- First argument: Environment (currently supports 'local')
- Second argument: Detached mode (true/false)

### `scripts/run_migrations.sh`
**Purpose:** Run database migrations for any environment

**Usage:**
```bash
# Local environment
./scripts/run_migrations.sh local

# Staging environment (requires DATABASE_URL)
./scripts/run_migrations.sh staging

# Production environment (requires DATABASE_URL)
./scripts/run_migrations.sh production
```

**Features:**
- Environment-aware execution
- Docker Compose support for local
- Seed data population (configurable)
- Health check waiting
- Error validation

**Environment Variables:**
- `SKIP_DB_SEED` - Set to 'true' to skip seed data

### `scripts/rollback.sh`
**Purpose:** Rollback Helm deployments in Kubernetes

**Usage:**
```bash
./scripts/rollback.sh staging
./scripts/rollback.sh production
```

**Functionality:**
- Executes Helm rollback
- Waits for deployment rollout
- Validates both API and Web services

## 4. GitHub Actions CI/CD Pipeline

### Workflow Files

#### `.github/workflows/ci.yml`
Continuous Integration workflow for code quality checks.

**Triggers:**
- Pushes to main/develop branches
- Pull requests to main/develop branches

**Jobs:**

1. **Lint** - ESLint and Prettier checks
   - Runs pnpm lint
   - Checks code formatting

2. **Type Check** - TypeScript validation
   - Runs pnpm type-check
   - Validates all type definitions

3. **Unit Tests** - Test execution
   - Runs pnpm test:unit
   - Uploads coverage artifacts

4. **Build** - Application build
   - Runs pnpm build
   - Validates build process

#### `.github/workflows/ci-cd.yml`
Complete CI/CD pipeline with deployment.

**Triggers:**
- Push to main/develop
- Manual trigger (workflow_dispatch)
- Pull requests to main

**Jobs:**

1. **Test API** - API service tests
   - npm ci
   - npm test

2. **Test Web** - Web service tests
   - npm ci
   - npm test

3. **Build API** - Docker image build
   - Dependency: test-api
   - Pushes to ghcr.io

4. **Build Web** - Docker image build
   - Dependency: test-web
   - Pushes to ghcr.io

5. **Run Migrations (Staging)**
   - Runs database migrations
   - Uses STAGING_DATABASE_URL secret

6. **Deploy Staging**
   - Helm deployment
   - Requires gated approval

7. **Run Migrations (Production)**
   - Production database migrations
   - Uses PRODUCTION_DATABASE_URL secret

8. **Deploy Production**
   - Production Helm deployment
   - Requires gated approval

### Pipeline Features

- **Matrix Strategy:** Node.js 18.x
- **Caching:** npm and pnpm dependencies cached
- **Artifacts:** Coverage reports uploaded
- **Security:** GitHub Token for registry authentication
- **Approval Gates:** Staging and Production require approval

## 5. Documentation

### `docs/deployment-guide.md`
Comprehensive deployment guide covering:

**Topics:**
- Local development setup
- Environment configuration reference
- Docker Compose details
- Database migrations
- Logs management (local and production)
- Environment secrets
- Production deployment
- Worker processes
- Cron jobs
- Troubleshooting

**Size:** ~14,000 words
**Audience:** DevOps, Developers, SREs

### `QUICKSTART.md`
Fast-track getting started guide.

**Topics:**
- Prerequisites
- Quick setup (5 steps)
- Common commands
- Troubleshooting quick fixes
- Tips and tricks

**Size:** ~4,500 words
**Audience:** Developers starting with the project

### `README.md` (Updated)
Main project README enhanced with:

**New Sections:**
- Environment Configuration & Secrets
- Logs Management
- CI/CD Pipeline details
- Deployment Considerations
- Documentation reference links

## 6. Makefile Commands

Enhanced Makefile with new targets:

```makefile
make build         # Build Docker images
make test          # Run tests
make up            # Start development
make down          # Stop development
make clean         # Clean containers and volumes
make start         # Start services with migration
make migrate       # Run migrations
make rollback      # Rollback Helm deployment
make logs          # View all logs
make api-logs      # View API logs
make web-logs      # View Web logs
make lint          # Run linting
make type-check    # Run type checking
make install       # Install dependencies
```

## 7. Secrets Management

### GitHub Secrets Required

**Staging Environment:**
- `STAGING_DATABASE_URL` - PostgreSQL connection
- `STAGING_REDIS_URL` - Redis connection
- `STAGING_JWT_ACCESS_SECRET` - JWT secret
- `STAGING_JWT_REFRESH_SECRET` - JWT refresh secret
- `STAGING_KUBECONFIG` - Kubernetes config (base64)

**Production Environment:**
- `PRODUCTION_DATABASE_URL` - PostgreSQL connection
- `PRODUCTION_REDIS_URL` - Redis connection
- `PRODUCTION_JWT_ACCESS_SECRET` - JWT secret
- `PRODUCTION_JWT_REFRESH_SECRET` - JWT refresh secret
- `PRODUCTION_KUBECONFIG` - Kubernetes config (base64)

### Best Practices Implemented

1. **No Secrets in Code** - .gitignore excludes .env files
2. **Environment Separation** - Different secrets per environment
3. **Secure Defaults** - Dev secrets safe for development
4. **Documentation** - Secrets management guide included
5. **Rotation Policy** - Documented in deployment guide

## 8. Logs Management

### Local Development Logs

**Docker Compose Logs:**
```bash
docker compose logs -f              # All services
docker compose logs -f api          # API only
docker compose logs -f postgres     # Database only
```

**Features:**
- Real-time streaming
- Service-specific filtering
- Save to file capability

### Production Logs

**Kubernetes Logs:**
```bash
kubectl logs deployment/app-api -n production
kubectl logs deployment/app-web -n production
```

**Log Aggregation:**
- Elasticsearch + Kibana
- Datadog
- CloudWatch
- Stackdriver

## 9. Deployment Architecture

### Local Development
- Single-node Docker Compose stack
- All services on one machine
- Automatic restart on failure
- Volume persistence

### Staging
- Kubernetes cluster deployment
- Via Helm charts
- Separate pods for API and Web
- PostgreSQL managed service
- Redis managed service

### Production
- Multi-node Kubernetes
- Separate API and Worker deployments
- Load balancing
- Auto-scaling (optional)
- Managed databases

## 10. Worker Processes & Cron Jobs

### Separate Worker Architecture

Recommended for production:
- **API Service:** HTTP request handling (scale horizontally)
- **Worker Service:** Background jobs (process queue)

**Deployment:**
- Separate Kubernetes deployments
- Different pod counts
- Different resource allocation

### Kubernetes CronJobs

Alternative if separate workers not feasible:

**Use Cases:**
- Database cleanup
- Report generation
- Cache refresh
- Backups

**Configuration:**
- Scheduled execution
- Automatic retry on failure
- Historical tracking

## 11. Verification Checklist

✅ **Docker Compose**
- [x] PostgreSQL service configured
- [x] Redis service configured
- [x] API service configured
- [x] Web service configured
- [x] Network connectivity configured
- [x] Health checks enabled
- [x] Volume persistence configured
- [x] Config validates successfully

✅ **Environment Files**
- [x] .env.example created
- [x] .env.local.example created
- [x] .env.staging.example created
- [x] .env.production.example created
- [x] .gitignore includes .env files

✅ **Migration Scripts**
- [x] run_migrations.sh enhanced
- [x] start-services.sh created
- [x] rollback.sh functional
- [x] Scripts executable

✅ **CI/CD Pipeline**
- [x] ci.yml includes lint
- [x] ci.yml includes type-check
- [x] ci.yml includes tests
- [x] ci.yml includes build
- [x] ci-cd.yml complete
- [x] Workflows validated

✅ **Documentation**
- [x] deployment-guide.md created (~14k words)
- [x] QUICKSTART.md created (~4.5k words)
- [x] README.md updated with logs/secrets sections
- [x] DEVOPS_CONFIGURATION.md created

✅ **Makefile**
- [x] start target added
- [x] lint target added
- [x] type-check target added
- [x] help text updated

## 12. Quick Start

### For Local Development

```bash
# 1. Clone and setup
git clone <repo>
cd project
cp .env.example .env

# 2. Start services
./scripts/start-services.sh local

# 3. Run migrations
./scripts/run_migrations.sh local

# 4. Access
# Web: http://localhost:3000
# API: http://localhost:3001
```

### For Deployment

```bash
# Configure GitHub Secrets (see docs/deployment-guide.md)
# Commit to main/develop
# CI/CD pipeline executes automatically
# Staging: Auto-deploys on approval
# Production: Manual approval required
```

## 13. Additional Resources

- `docs/deployment-guide.md` - Comprehensive deployment guide
- `docs/deployment.md` - Original deployment documentation
- `docs/database-migrations.md` - Migration strategies
- `docs/kubernetes-secrets.md` - Kubernetes secret management
- `docs/rollback-strategy.md` - Emergency procedures
- `QUICKSTART.md` - Fast-track setup guide
- `README.md` - Project overview with updates

## 14. Support & Troubleshooting

See `docs/deployment-guide.md` "Troubleshooting" section for:
- Database connection issues
- Redis connection issues
- Migration failures
- Service startup issues
- Port conflicts
- Database reset procedures

---

**Status:** ✅ Complete
**Last Updated:** 2024-11-14
**Configuration Version:** 1.0
