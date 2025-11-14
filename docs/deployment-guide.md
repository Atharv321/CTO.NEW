# Deployment Guide

This guide covers deployment strategies, logs management, and environment configuration for the monorepo application.

## Table of Contents

1. [Local Development](#local-development)
2. [Environment Configuration](#environment-configuration)
3. [Docker Compose Setup](#docker-compose-setup)
4. [Database Migrations](#database-migrations)
5. [Logs Management](#logs-management)
6. [Environment Secrets](#environment-secrets)
7. [Production Deployment](#production-deployment)
8. [Worker Processes](#worker-processes)
9. [Cron Jobs](#cron-jobs)
10. [Troubleshooting](#troubleshooting)

## Local Development

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local testing)
- Git

### Quick Start

1. **Clone the repository and navigate to the project:**

```bash
cd /path/to/project
```

2. **Copy environment configuration:**

```bash
cp .env.example .env
```

For local customization (optional):

```bash
cp .env.local.example .env.local
```

3. **Start services:**

```bash
./scripts/start-services.sh local
```

Or using Docker Compose directly:

```bash
docker compose up -d
```

4. **Run database migrations:**

```bash
./scripts/run_migrations.sh local
```

5. **Access services:**

- Web UI: http://localhost:3000
- API: http://localhost:3001
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Useful Commands

```bash
# View all service logs
docker compose logs -f

# View API logs only
docker compose logs -f api

# View Web logs only
docker compose logs -f web

# Stop all services
docker compose down

# Stop and remove volumes (clean database)
docker compose down -v

# Rebuild services
docker compose build
```

## Environment Configuration

### Environment Files

Environment files are used to configure the application for different environments. The following environment files are provided as examples:

- `.env.example` - Default environment configuration
- `.env.local.example` - Local development overrides
- `.env.staging.example` - Staging environment template
- `.env.production.example` - Production environment template

### Environment Variables Reference

#### Database Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_USER` | postgres | PostgreSQL username |
| `DB_PASSWORD` | postgres | PostgreSQL password |
| `DB_NAME` | monorepo | PostgreSQL database name |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DATABASE_URL` | - | Full PostgreSQL connection string |

#### Redis Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_PORT` | 6379 | Redis port |
| `REDIS_URL` | redis://localhost:6379 | Redis connection string |

#### API Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PORT` | 3001 | API server port |
| `NODE_ENV` | development | Environment (development/staging/production) |
| `JWT_ACCESS_SECRET` | dev-secret-key | JWT signing secret for access tokens |
| `JWT_REFRESH_SECRET` | dev-refresh-key | JWT signing secret for refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | 15m | Access token expiration |
| `JWT_REFRESH_EXPIRES_IN` | 7d | Refresh token expiration |

#### Web Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `WEB_PORT` | 3000 | Web server port |
| `VITE_API_URL` | http://localhost:3001 | API base URL |

## Docker Compose Setup

### Services

The `docker-compose.yml` defines the following services:

#### PostgreSQL

- **Image:** postgres:15-alpine
- **Container:** monorepo-postgres
- **Port:** 5432
- **Volume:** postgres_data (persistent storage)
- **Health Check:** Enabled

#### Redis

- **Image:** redis:7-alpine
- **Container:** monorepo-redis
- **Port:** 6379
- **Volume:** redis_data (persistent storage)
- **Health Check:** Enabled

#### API Service

- **Build Context:** ./api
- **Container:** monorepo-api
- **Port:** 3001
- **Dependencies:** PostgreSQL, Redis (with health checks)
- **Auto-reload:** Enabled (development)

#### Web Service

- **Build Context:** ./web
- **Container:** monorepo-web
- **Port:** 3000
- **Dependencies:** API service

### Network

All services communicate through a dedicated bridge network: `monorepo-network`

### Volumes

- `postgres_data` - PostgreSQL data persistence
- `redis_data` - Redis data persistence

## Database Migrations

### Running Local Migrations

```bash
# Run migrations with seeding (default)
./scripts/run_migrations.sh local

# Run migrations without seeding
SKIP_DB_SEED=true ./scripts/run_migrations.sh local
```

### Running Remote Migrations

```bash
# Staging environment (requires DATABASE_URL set via GitHub Secrets)
./scripts/run_migrations.sh staging

# Production environment (requires DATABASE_URL set via GitHub Secrets)
./scripts/run_migrations.sh production
```

### Creating New Migrations

1. Update the Prisma schema in `api/prisma/schema.prisma`
2. Run migration in the API directory:

```bash
cd api
npx prisma migrate dev --name <descriptive-name>
```

3. Commit both the schema and migration files to git

See `docs/database-migrations.md` for detailed guidance.

## Logs Management

### Local Logs

#### Docker Compose Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f web
docker compose logs -f postgres
docker compose logs -f redis

# With timestamps
docker compose logs -f --timestamps

# Last 100 lines
docker compose logs --tail=100

# Save logs to file
docker compose logs > logs.txt
```

#### Log Files Location

When running locally with Docker:
- Logs are streamed to stdout/stderr
- Use `docker compose logs` to retrieve them

### Production Logs

#### Kubernetes Logs

```bash
# API logs
kubectl logs deployment/app-api -n production --tail=100 -f

# Web logs
kubectl logs deployment/app-web -n production --tail=100 -f

# Previous logs (for crashed containers)
kubectl logs deployment/app-api -n production --previous

# All logs with timestamps
kubectl logs deployment/app-api -n production -f --timestamps
```

#### Log Aggregation

For production deployments, logs should be aggregated using tools like:
- **Elasticsearch + Kibana** - For log search and analysis
- **Datadog** - For monitoring and alerting
- **CloudWatch** - AWS-managed logging
- **Stackdriver** - GCP-managed logging

#### Application Logging Best Practices

- **Use structured logging:** Log as JSON for easier parsing
- **Include context:** Add request IDs, user IDs, and trace IDs
- **Log levels:** Use appropriate levels (error, warn, info, debug)
- **Sensitive data:** Never log passwords, tokens, or PII

### Log Retention

- **Local:** Managed by Docker; configure in Docker daemon
- **Production:** Configure retention in your log aggregation service

## Environment Secrets

### Development Environment

For local development, use the `.env` file:

```bash
cp .env.example .env
# Edit .env with your local values
```

**IMPORTANT:** Never commit `.env` files to git. The `.gitignore` should include:
```
.env
.env.local
.env.*.local
```

### Staging & Production Secrets

Use GitHub Secrets for sensitive data in CI/CD pipelines.

#### Setting Up GitHub Secrets

1. Navigate to: Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add secrets for each environment:

#### Required Secrets

**Staging Environment:**
- `STAGING_DATABASE_URL` - PostgreSQL connection string
- `STAGING_REDIS_URL` - Redis connection string
- `STAGING_JWT_ACCESS_SECRET` - JWT signing secret
- `STAGING_JWT_REFRESH_SECRET` - JWT refresh secret
- `STAGING_KUBECONFIG` - Kubernetes config (base64 encoded)

**Production Environment:**
- `PRODUCTION_DATABASE_URL` - PostgreSQL connection string
- `PRODUCTION_REDIS_URL` - Redis connection string
- `PRODUCTION_JWT_ACCESS_SECRET` - JWT signing secret
- `PRODUCTION_JWT_REFRESH_SECRET` - JWT refresh secret
- `PRODUCTION_KUBECONFIG` - Kubernetes config (base64 encoded)

#### Secrets Management Best Practices

1. **Rotation:** Rotate secrets regularly (quarterly minimum)
2. **Scope:** Give each secret the minimum required permissions
3. **Monitoring:** Audit secret access and usage
4. **Backup:** Keep secure backups of secrets
5. **Never in code:** Never hardcode secrets in source files

### Kubernetes Secrets

For Kubernetes deployments, create secrets:

```bash
# Create secret from file
kubectl create secret generic app-secrets \
  --from-literal=DATABASE_URL=<url> \
  --from-literal=REDIS_URL=<url> \
  -n production

# Create secret from file
kubectl create secret generic app-secrets \
  --from-file=.env.production \
  -n production
```

Reference in deployment:

```yaml
spec:
  template:
    spec:
      containers:
      - name: api
        envFrom:
        - secretRef:
            name: app-secrets
```

## Production Deployment

### Deployment Pipeline

The CI/CD pipeline (`.github/workflows/ci-cd.yml`) follows these steps:

1. **Test** - Run unit tests for API and Web
2. **Build** - Build Docker images
3. **Push** - Push images to container registry
4. **Migrate** - Run database migrations
5. **Deploy** - Deploy to staging and production

### Deployment Requirements

- Docker images built and pushed to container registry
- Database migrations completed successfully
- All tests passing
- Environment secrets configured in GitHub

### Manual Deployment

For manual deployments using Helm:

```bash
# Add Helm repository (if needed)
helm repo add app https://charts.example.com
helm repo update

# Staging deployment
helm upgrade --install app ./helm \
  --namespace staging \
  --create-namespace \
  --set api.image.repository=ghcr.io/org/api \
  --set api.image.tag=<SHA> \
  --set web.image.repository=ghcr.io/org/web \
  --set web.image.tag=<SHA> \
  --wait

# Production deployment
helm upgrade --install app ./helm \
  --namespace production \
  --create-namespace \
  --values helm/values-production.yaml \
  --wait
```

### Verification

```bash
# Check deployment status
kubectl rollout status deployment/app-api -n production

# Verify services are running
kubectl get pods -n production

# Check service endpoints
kubectl get svc -n production
```

### Rollback

```bash
# Using script
./scripts/rollback.sh production app

# Manual rollback
helm rollback app -n production
```

See `docs/rollback-strategy.md` for detailed rollback procedures.

## Worker Processes

### Separate API and Worker Processes

In production, it's recommended to run separate deployments for:

1. **API Service** - Handles HTTP requests
2. **Worker Service** - Handles background jobs

### Configuration

**Kubernetes Deployment Example:**

```yaml
# API Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: ghcr.io/org/api:latest
        env:
        - name: NODE_ENV
          value: production
        - name: WORKER_MODE
          value: "false"

---
# Worker Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-worker
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: worker
        image: ghcr.io/org/api:latest
        env:
        - name: NODE_ENV
          value: production
        - name: WORKER_MODE
          value: "true"
```

### Resource Allocation

- **API:** Higher memory and CPU for handling requests
- **Worker:** Lower baseline, scales based on queue load

### Monitoring

Monitor worker job completion:
- Queue depth
- Job processing time
- Error rates
- Worker availability

## Cron Jobs

### Alternative to Separate Workers

If separate worker processes aren't feasible, use Kubernetes CronJobs:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: app-cleanup-job
spec:
  schedule: "0 2 * * *"  # 2 AM daily
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: cleanup
            image: ghcr.io/org/api:latest
            command:
            - sh
            - -c
            - npm run cleanup-job
          restartPolicy: OnFailure
```

### Job Types

- **Scheduled cleanup** - Remove old data (logs, temp files)
- **Report generation** - Daily/weekly reports
- **Cache refresh** - Update cached data
- **Backup** - Database backups

### Monitoring Cron Jobs

```bash
# List CronJobs
kubectl get cronjobs -n production

# View job history
kubectl get jobs -n production

# View job logs
kubectl logs job/app-cleanup-job -n production
```

## Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
docker compose exec postgres psql -U postgres -d monorepo -c "SELECT 1;"

# Check connection string
echo $DATABASE_URL

# Verify environment variables
docker compose exec api env | grep DATABASE
```

### Redis Connection Issues

```bash
# Test Redis connection
docker compose exec redis redis-cli ping

# Check Redis logs
docker compose logs redis

# Verify Redis configuration
docker compose exec redis redis-cli config get "*"
```

### Migration Failures

```bash
# Check migration status
docker compose exec api npm run prisma:status

# View pending migrations
cd api && npx prisma migrate status

# Retry failed migration
./scripts/run_migrations.sh local
```

### Service Not Starting

```bash
# Check service logs
docker compose logs <service-name>

# Inspect container
docker compose exec <service-name> sh

# Check resource usage
docker stats

# Restart service
docker compose restart <service-name>
```

### Port Already in Use

```bash
# Find process using port
lsof -i :3000  # Web
lsof -i :3001  # API
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Kill process
kill -9 <PID>

# Or use different ports in .env
WEB_PORT=3002
API_PORT=3002
DB_PORT=5433
REDIS_PORT=6380
```

## Additional Resources

- `docs/deployment.md` - Original deployment guide
- `docs/database-migrations.md` - Migration best practices
- `docs/kubernetes-secrets.md` - Kubernetes secret management
- `docs/rollback-strategy.md` - Emergency rollback procedures
- `docker-compose.yml` - Docker Compose configuration
- `.github/workflows/ci-cd.yml` - CI/CD pipeline definition
