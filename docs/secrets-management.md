# Secrets Management

This document outlines the approach to managing secrets and sensitive configuration across all deployment environments.

## GitHub Secrets

The CI/CD pipeline uses GitHub repository secrets for sensitive information. Navigate to **Settings → Secrets and variables → Actions** in your GitHub repository to configure:

### Required Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `STAGING_DATABASE_URL` | Database connection string for staging | `postgresql://user:pass@host:5432/db` |
| `STAGING_KUBECONFIG` | Base64-encoded kubeconfig file for staging Kubernetes cluster | `cat ~/.kube/config | base64` |
| `PRODUCTION_DATABASE_URL` | Database connection string for production | `postgresql://user:pass@host:5432/db` |
| `PRODUCTION_KUBECONFIG` | Base64-encoded kubeconfig file for production Kubernetes cluster | `cat ~/.kube/config | base64` |

### Adding Secrets

1. Go to your repository on GitHub.
2. Navigate to **Settings → Secrets and variables → Actions**.
3. Click **New repository secret**.
4. Enter the name and value, then click **Add secret**.

## Environment-Specific Configuration

### Local Development

Use the `.env` file (not tracked in git) to store local secrets. Copy `.env.example` to `.env` and populate with development values.

```bash
cp .env.example .env
```

### Staging Environment

- Secrets are injected via GitHub Actions workflow using the `staging` environment.
- Kubernetes secrets are managed via Helm values or external secret managers.

### Production Environment

- Use a centralized secret management solution such as:
  - **AWS Secrets Manager** or **AWS Systems Manager Parameter Store**
  - **Azure Key Vault**
  - **Google Cloud Secret Manager**
  - **HashiCorp Vault**
- Rotate credentials regularly.
- Restrict access using IAM policies and RBAC.

## Kubernetes Secrets

For Helm deployments, secrets can be created manually or via tools like **sealed-secrets** or **external-secrets**.

### Manual Secret Creation

```bash
kubectl create secret generic app-secrets \
  --from-literal=database-url=postgresql://user:pass@host:5432/db \
  --namespace staging
```

### Using External Secrets Operator

1. Install [External Secrets Operator](https://external-secrets.io/).
2. Configure `SecretStore` to point to AWS Secrets Manager, Azure Key Vault, etc.
3. Reference secrets in your Helm chart deployment manifests.

## Best Practices

1. **Never commit secrets to version control.**
2. Use `.gitignore` to exclude `.env` and other secret files.
3. Rotate credentials periodically (e.g., every 90 days).
4. Use minimal permissions for service accounts and API keys.
5. Audit access to secret stores and Kubernetes secrets.
6. Use encryption at rest and in transit for all secret stores.
7. Implement automated secret scanning in CI/CD (e.g., `git-secrets`, `truffleHog`).

## Secret Rotation

When rotating secrets:

1. Update the secret in the secret store (GitHub Secrets, AWS Secrets Manager, etc.).
2. Re-run migrations and deployment workflows to pick up new credentials.
3. Verify connectivity and health checks.
4. Remove old credentials after confirming successful rotation.

For Kubernetes secrets:

```bash
kubectl delete secret app-secrets -n staging
kubectl create secret generic app-secrets \
  --from-literal=database-url=NEW_VALUE \
  --namespace staging
kubectl rollout restart deployment/app-api -n staging
```

## Troubleshooting

- If a deployment fails due to missing secrets, check GitHub Secrets configuration.
- Verify that kubeconfig secrets are base64-encoded correctly.
- For database connection issues, confirm `DATABASE_URL` format and network access.
