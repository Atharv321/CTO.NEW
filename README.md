# Sample Deployment Pipeline

This repository provides a reference implementation for a full CI/CD pipeline deploying a simple two-service application (API + Web).

## Project Structure

- `api/` – Node.js API service
- `web/` – Node.js web frontend
- `docker-compose.yml` – Local development stack
- `docker-compose.prod.yml` – Production-ready stack using pre-built images
- `helm/` – Helm chart for Kubernetes deployments
- `.github/workflows/ci-cd.yml` – GitHub Actions workflow for CI/CD
- `docs/deployment.md` – Detailed deployment guide
- `docs/ci-cd-pipeline.md` – CI/CD workflow deep dive
- `docs/kubernetes-secrets.md` – Kubernetes secret management
- `docs/architecture.md` – System architecture overview
- `scripts/` – Utility scripts (migrations, rollback)

## Getting Started

1. Copy `.env.example` to `.env` and adjust the values as needed.
2. Install dependencies with `make install` (optional but recommended for running tests locally).
3. Run `make up` to start the full stack locally.
4. Visit the web UI at `http://localhost:3000` and the API health endpoint at `http://localhost:3001/health`.

### Useful Commands

| Command | Description |
| ------- | ----------- |
| `make build` | Build Docker images for local services |
| `make up` / `make down` | Start or stop the Docker Compose stack |
| `make clean` | Stop services and remove volumes |
| `make test` | Run unit tests for API and Web |
| `make migrate` | Execute local database migrations |
| `make logs` | Tail logs for all services |
| `make rollback` | Trigger staging rollback via Helm |

## CI/CD Pipeline

- Triggered on pushes to `main` and pull requests targeting `main`.
- Runs unit tests for both services, builds Docker images, executes migrations, and deploys to the `staging` environment via Helm.
- Requires gated approvals configured in the GitHub `staging` environment before deployment steps run.

See [`docs/deployment.md`](docs/deployment.md) for detailed documentation, including environment variable references, secrets management, migrations, and rollback procedures.
