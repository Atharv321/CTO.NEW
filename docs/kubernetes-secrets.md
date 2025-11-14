# Kubernetes Secrets Setup

This document provides commands for creating Kubernetes secrets required by the Helm chart deployment.

## Database Secrets

The API service requires a database connection string, which should be stored in a Kubernetes secret for security.

### Staging Environment

```bash
# Create database secret for staging
kubectl create secret generic app-staging-database \
  --from-literal=database-url='postgresql://user:password@db-host:5432/dbname' \
  --namespace staging

# Verify the secret
kubectl get secret app-staging-database -n staging
kubectl describe secret app-staging-database -n staging
```

### Production Environment

```bash
# Create database secret for production
kubectl create secret generic app-production-database \
  --from-literal=database-url='postgresql://user:password@db-host:5432/dbname' \
  --namespace production

# Verify the secret
kubectl get secret app-production-database -n production
kubectl describe secret app-production-database -n production
```

## Using External Secret Managers

For enhanced security and secret management, integrate with external secret stores:

### AWS Secrets Manager

1. Install External Secrets Operator:

```bash
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets -n external-secrets-system --create-namespace
```

2. Create SecretStore:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: staging
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
```

3. Create ExternalSecret:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-staging-database
  namespace: staging
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: app-staging-database
    creationPolicy: Owner
  data:
    - secretKey: database-url
      remoteRef:
        key: /app/staging/database-url
```

### HashiCorp Vault

1. Install Vault Secrets Operator:

```bash
helm repo add hashicorp https://helm.releases.hashicorp.com
helm install vault hashicorp/vault --namespace vault --create-namespace
```

2. Configure Vault authentication and policies.

3. Create VaultStaticSecret:

```yaml
apiVersion: secrets.hashicorp.com/v1beta1
kind: VaultStaticSecret
metadata:
  name: app-staging-database
  namespace: staging
spec:
  type: kv-v2
  mount: secret
  path: app/staging/database
  refreshAfter: 3600s
  destination:
    name: app-staging-database
    create: true
  rolloutRestartTargets:
    - kind: Deployment
      name: app-api
```

## TLS Certificate Secrets

For ingress TLS termination, create certificate secrets:

### Using cert-manager (recommended)

1. Install cert-manager:

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

2. Create ClusterIssuer:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
```

3. Update Helm values to use cert-manager:

```yaml
ingress:
  enabled: true
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  hosts:
    - host: app.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: app-tls
      hosts:
        - app.example.com
```

### Manual certificate secrets

```bash
# Create TLS secret from cert and key files
kubectl create secret tls app-tls \
  --cert=path/to/tls.crt \
  --key=path/to/tls.key \
  --namespace production
```

## Image Pull Secrets

For private container registries:

```bash
# Create Docker registry secret
kubectl create secret docker-registry regcred \
  --docker-server=ghcr.io \
  --docker-username=github-username \
  --docker-password=github-token \
  --docker-email=email@example.com \
  --namespace staging
```

Update Helm deployment to use the secret:

```yaml
spec:
  imagePullSecrets:
    - name: regcred
```

## Secret Rotation

### Manual rotation

```bash
# Delete existing secret
kubectl delete secret app-staging-database -n staging

# Recreate with new values
kubectl create secret generic app-staging-database \
  --from-literal=database-url='postgresql://newuser:newpassword@db-host:5432/dbname' \
  --namespace staging

# Force pod restart to pick up new secret
kubectl rollout restart deployment/app-api -n staging
```

### Automated rotation with External Secrets

External Secrets Operator automatically refreshes secrets based on `refreshInterval`:

```yaml
spec:
  refreshInterval: 1h  # Check for updates every hour
```

## Best Practices

1. **Never commit secrets to version control**
2. **Use namespace isolation** - Create separate secrets for each namespace
3. **Encrypt secrets at rest** - Enable encryption in etcd
4. **Use RBAC** - Restrict access to secrets via Role-Based Access Control
5. **Rotate regularly** - Change secrets every 90 days or per compliance requirements
6. **Audit access** - Enable audit logging for secret access
7. **Use external secret managers** - Integrate with AWS Secrets Manager, Vault, etc.
8. **Delete unused secrets** - Clean up secrets from previous deployments

## Troubleshooting

### Secret not found error

```bash
# Check if secret exists
kubectl get secrets -n staging | grep app-staging-database

# If missing, create it
kubectl create secret generic app-staging-database \
  --from-literal=database-url='postgresql://user:pass@host:5432/db' \
  --namespace staging
```

### Pod cannot access secret

```bash
# Check pod describe for mount errors
kubectl describe pod <pod-name> -n staging

# Verify secret is in correct namespace
kubectl get secret app-staging-database -n staging

# Check service account permissions
kubectl get sa -n staging
kubectl describe sa default -n staging
```

### Secret value incorrect

```bash
# View secret (base64 encoded)
kubectl get secret app-staging-database -n staging -o yaml

# Decode secret value
kubectl get secret app-staging-database -n staging -o jsonpath='{.data.database-url}' | base64 -d

# Update secret
kubectl create secret generic app-staging-database \
  --from-literal=database-url='NEW_VALUE' \
  --namespace staging \
  --dry-run=client -o yaml | kubectl apply -f -
```
