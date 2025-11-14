# Deployment Guide

This document outlines the infrastructure, deployment process, environment configuration, and rollback strategy for the project. It should be used by developers and operations teams to manage the pipeline and environments.

## Overview

The project contains two services:

- **API service** (Node.js/Express) located in `api/`
- **Web frontend** (Node.js/Express static server) located in `web/`

Both services are containerized and can be orchestrated via Docker Compose or Helm charts for Kubernetes.

CI/CD is implemented with GitHub Actions and targets a staging environment by default, with gated approvals before deployment.

## Infrastructure-as-Code

### Docker Images

- `api/Dockerfile` builds the API service image.
- `web/Dockerfile` builds the web frontend image.

Both Dockerfiles follow a multi-stage build pattern that produces minimal runtime images.

### Docker Compose

- `docker-compose.yml` is used for local development. It includes the API, Web, and Postgres services.
- `docker-compose.prod.yml` is configured for production/staging usage and expects pre-built images. Environment variables must be supplied via an `.env` file or external secret store.

### Helm Charts

Located under `helm/`:

- `Chart.yaml` describes the chart metadata.
- `values.yaml` contains default deployment values for API, Web, and optional ingress configuration.
- `templates/` contains deployments, services, and ingress manifests for both API and Web services.

Customize values per environment using `helm upgrade -f values.staging.yaml` or `--set` overrides.

## Continuous Integration / Continuous Deployment

The GitHub Actions workflow is located at `.github/workflows/ci-cd.yml` and covers the following stages:

1. **Test API** – Installs dependencies and runs Jest unit tests for the API service.
2. **Test Web** – Installs dependencies and runs Jest unit tests for the Web service.
3. **Build API Image** – Builds and pushes the API container image to GHCR.
4. **Build Web Image** – Builds and pushes the Web container image to GHCR.
5. **Run Migrations** – Executes database migrations for the API before deployment.
6. **Deploy to Staging** – Deploys via Helm to the staging Kubernetes namespace (requires manual approval via GitHub Environments and secrets).
7. **Deploy to Production** – Optional stage that can be enabled with proper approvals and environment configuration.

### Triggering

- Automatic on push to `main`.
- Manual via `workflow_dispatch`.

### Approvals

- The `staging` environment is configured in GitHub Environments with required reviewers to enforce gated approvals before deployment steps run.

### Artifacts

- Coverage reports for API and Web are uploaded as workflow artifacts for analysis.

## Environment Variables & Secrets

| Name | Location | Description |
| ---- | -------- | ----------- |
| `PORT` | API/Web containers | Port for each service to listen on. |
| `DATABASE_URL` | API | Connection string for Postgres. Injected via Kubernetes secret (`database.existingSecret`). |
| `POSTGRES_USER` | DB | Database username. |
| `POSTGRES_PASSWORD` | DB | Database password. |
| `POSTGRES_DB` | DB | Database name. |
| `API_BASE_URL` | Web | Base URL for API requests. |
| `API_IMAGE`, `WEB_IMAGE` | Deploy scripts | Image references for Docker Compose deployments. |
| `STAGING_DATABASE_URL` | GitHub Secret | Postgres connection for staging migrations. |
| `STAGING_KUBECONFIG` | GitHub Secret | Base64-encoded kubeconfig for staging cluster access. |
| `PRODUCTION_DATABASE_URL` | GitHub Secret | Postgres connection for production migrations. |
| `PRODUCTION_KUBECONFIG` | GitHub Secret | Base64-encoded kubeconfig for production cluster (optional). |

Store all secrets in GitHub Secrets or a centralized secret manager (e.g., HashiCorp Vault, AWS Secrets Manager). Reference them via the workflow environment configuration and avoid committing secrets to the repository.

## Database Migrations

Migrations are executed via `npm run migrate` within the API service. The migration script currently acts as a placeholder and should be replaced with actual migration tooling (e.g., Knex, Prisma, TypeORM) as the application grows.

- Local: `./scripts/run_migrations.sh local`
- CI/CD: Triggered automatically in the `run-migrations` step with `STAGING_DATABASE_URL` provided.

Ensure migrations are idempotent and forward-only. Before releasing to production, review migration scripts in the staging environment first.

## Rollback Strategy

If deployment issues occur:

1. Run `scripts/rollback.sh staging` to roll back to the previous Helm release in staging.
2. Monitor pod health and logs (`kubectl logs`, `kubectl get pods`).
3. For production, perform the same rollback with the `production` namespace: `scripts/rollback.sh production`.

Additionally:

- Retain previous Docker image tags (e.g., commit SHA tags) to allow redeployment to the prior version via Helm or Docker Compose.
- Verify database state—if migrations were run that are incompatible with rollback, apply compensating migrations if necessary.

## Local Development

1. Copy `.env.example` to `.env` and set required environment variables.
2. Run `docker compose up --build` to start API, Web, and DB services locally.
3. Access the web app on `http://localhost:3000` and the API at `http://localhost:3001`.

## Production Deployment Checklist

- Ensure all tests pass in CI.
- Verify Docker images are pushed (`ghcr.io/<org>/<repo>/api:<tag>` and `ghcr.io/<org>/<repo>/web:<tag>`).
- Approve the staging deployment.
- Confirm staging health checks and smoke tests.
- Approve production deployment if automated or run `helm upgrade --install` manually using the generated images.
