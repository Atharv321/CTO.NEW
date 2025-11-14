# CI/CD Pipeline Guide

This document provides detailed information about the Continuous Integration and Continuous Deployment (CI/CD) pipeline configured for this project using GitHub Actions.

## Pipeline Overview

The CI/CD pipeline is defined in `.github/workflows/ci-cd.yml` and provides automated testing, building, and deployment capabilities for the API and Web services.

### Workflow Triggers

The pipeline is triggered by the following events:

1. **Push to `main` or `develop` branches** - Full CI/CD execution on `main`, tests only on `develop`
2. **Pull requests targeting `main`** - Runs tests without deployment
3. **Manual dispatch** - Via GitHub Actions UI using `workflow_dispatch`

### Pipeline Stages

#### 1. Test API

- **Purpose**: Validate API service code quality
- **Runs on**: All triggers (push, PR, manual)
- **Steps**:
  - Checkout code
  - Setup Node.js 18 with npm caching
  - Install dependencies via `npm ci`
  - Run Jest tests with coverage
  - Upload coverage report as artifact

**Required**: Must pass for pipeline to proceed to build stage.

#### 2. Test Web

- **Purpose**: Validate Web service code quality
- **Runs on**: All triggers (push, PR, manual)
- **Steps**:
  - Checkout code
  - Setup Node.js 18 with npm caching
  - Install dependencies via `npm ci`
  - Run Jest tests with coverage
  - Upload coverage report as artifact

**Required**: Must pass for pipeline to proceed to build stage.

#### 3. Build API Image

- **Purpose**: Build and push API Docker image to GitHub Container Registry
- **Runs on**: Push to `main` only
- **Depends on**: `test-api` job success
- **Steps**:
  - Checkout code
  - Setup Docker Buildx for advanced build features
  - Authenticate to GitHub Container Registry (GHCR)
  - Determine image tag based on Git SHA
  - Build multi-stage Docker image
  - Push image with two tags: `<sha>` and `latest`
  - Use GitHub Actions cache for layer caching

**Outputs**: `image-tag` - The Git SHA used to tag the image

#### 4. Build Web Image

- **Purpose**: Build and push Web Docker image to GitHub Container Registry
- **Runs on**: Push to `main` only
- **Depends on**: `test-web` job success
- **Steps**:
  - Same as Build API Image, but for the Web service

**Outputs**: `image-tag` - The Git SHA used to tag the image

#### 5. Run Database Migrations

- **Purpose**: Execute database schema migrations before deployment
- **Runs on**: Push to `main` only
- **Depends on**: `build-api` job success
- **Environment**: `staging` (requires approval if configured)
- **Steps**:
  - Checkout code
  - Setup Node.js 18
  - Install API dependencies
  - Run migrations using `npm run migrate` with `STAGING_DATABASE_URL` secret

**Required Secret**: `STAGING_DATABASE_URL` - PostgreSQL connection string

#### 6. Deploy to Staging

- **Purpose**: Deploy API and Web services to staging Kubernetes cluster
- **Runs on**: Push to `main` only
- **Depends on**: `build-api`, `build-web`, and `run-migrations` success
- **Environment**: `staging` with URL `https://staging.example.com` (requires approval if configured)
- **Steps**:
  - Checkout code
  - Setup kubectl and Helm
  - Configure kubeconfig from secret
  - Deploy using Helm with image tags from build jobs
  - Wait for deployment to complete (5 minute timeout)
  - Verify rollout status for both API and Web deployments

**Required Secrets**:
- `STAGING_KUBECONFIG` - Base64-encoded kubeconfig for staging cluster

#### 7. Deploy to Production

- **Purpose**: Deploy API and Web services to production Kubernetes cluster
- **Runs on**: Push to `main` only
- **Depends on**: `deploy-staging`, `build-api`, `build-web` success
- **Environment**: `production` with URL `https://app.example.com` (requires approval)
- **Steps**:
  - Same as Deploy to Staging, but targeting production namespace

**Required Secrets**:
- `PRODUCTION_KUBECONFIG` - Base64-encoded kubeconfig for production cluster

## Container Registry

Images are pushed to GitHub Container Registry (GHCR) at:

- API: `ghcr.io/<org>/<repo>/api:<tag>`
- Web: `ghcr.io/<org>/<repo>/web:<tag>`

### Image Tags

- `<sha>` - Immutable tag based on Git commit SHA (e.g., `abc123def456`)
- `latest` - Mutable tag pointing to the most recent `main` build

## Gated Approvals

GitHub Environments provide deployment protection rules:

### Configuring Environment Protection

1. Go to **Settings → Environments** in your repository
2. Create environments: `staging` and `production`
3. Configure protection rules:
   - **Required reviewers**: Select team members who must approve
   - **Wait timer**: Optional delay before deployment
   - **Deployment branches**: Restrict to `main` branch

### Approval Workflow

1. Pipeline reaches deployment job
2. Job pauses and waits for approval
3. Configured reviewers receive notification
4. Reviewer approves or rejects deployment
5. On approval, deployment proceeds; on rejection, job fails

## Secrets Configuration

### GitHub Repository Secrets

Navigate to **Settings → Secrets and variables → Actions** and add:

| Secret Name | Description | How to Generate |
|------------|-------------|-----------------|
| `STAGING_DATABASE_URL` | PostgreSQL connection for staging | `postgresql://user:pass@host:5432/dbname` |
| `STAGING_KUBECONFIG` | Kubeconfig for staging cluster | `cat ~/.kube/config \| base64 -w0` |
| `PRODUCTION_DATABASE_URL` | PostgreSQL connection for production | Same as staging |
| `PRODUCTION_KUBECONFIG` | Kubeconfig for production cluster | Same as staging |

### Automatic Secrets

- `GITHUB_TOKEN` - Automatically provided by GitHub Actions for GHCR authentication

## Monitoring and Debugging

### Viewing Pipeline Runs

1. Go to **Actions** tab in your repository
2. Select the CI/CD Pipeline workflow
3. Click on a specific run to view details
4. Expand job steps to see logs

### Common Issues

#### Test Failures

- Review test output in job logs
- Download coverage artifact for detailed analysis
- Fix failing tests and push again

#### Build Failures

- Check Dockerfile syntax
- Verify all dependencies are properly specified
- Ensure `package.json` and `package-lock.json` are in sync

#### Deployment Failures

- Verify kubeconfig secret is correctly base64-encoded
- Check kubectl and Helm logs in deployment job
- Ensure Kubernetes cluster is accessible and has sufficient resources
- Verify Helm chart templates are valid

#### Image Pull Errors

- Ensure GitHub Container Registry authentication is configured
- Verify images were successfully pushed in build stage
- Check that image tags match between build and deploy stages

## Best Practices

1. **Always run tests locally** before pushing to avoid pipeline failures
2. **Use feature branches** and create pull requests to validate changes
3. **Review coverage reports** to ensure adequate test coverage
4. **Monitor deployments** in the GitHub Actions UI and Kubernetes cluster
5. **Test staging thoroughly** before approving production deployment
6. **Use rollback scripts** if issues are detected post-deployment
7. **Rotate secrets regularly** (at least every 90 days)
8. **Keep dependencies updated** to avoid security vulnerabilities

## Pipeline Metrics

Track these metrics to improve CI/CD performance:

- **Pipeline duration** - Time from push to production deployment
- **Test success rate** - Percentage of passing test runs
- **Deployment frequency** - Number of deployments per day/week
- **Mean time to recovery (MTTR)** - Average time to fix failed deployments
- **Change failure rate** - Percentage of deployments requiring rollback

## Future Enhancements

Consider implementing:

- **Canary deployments** - Gradual rollout to subset of users
- **Blue-green deployments** - Zero-downtime deployments
- **Automated smoke tests** - Post-deployment validation
- **Performance testing** - Load testing in staging environment
- **Security scanning** - Container vulnerability scanning
- **Slack/Teams notifications** - Deployment status alerts
- **Rollback automation** - Automatic rollback on health check failures
