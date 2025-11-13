# Rollback Strategy

This document outlines procedures for rolling back deployments in case of issues or failures.

## Overview

Rollbacks are critical for maintaining service availability when a deployment introduces bugs, performance issues, or breaking changes. This guide covers rollback procedures for both Kubernetes (Helm) and Docker Compose deployments.

## Rollback Triggers

Consider rolling back when:

- Application crashes or fails health checks after deployment
- Critical bugs are discovered in production
- Performance degrades significantly (high latency, memory leaks, CPU spikes)
- Database migrations fail or cause data corruption
- Security vulnerabilities are introduced

## Kubernetes/Helm Rollback

### Automated Rollback via Script

Use the provided rollback script:

```bash
./scripts/rollback.sh staging
```

Or for production:

```bash
./scripts/rollback.sh production
```

### Manual Helm Rollback

List release history:

```bash
helm history app -n staging
```

Rollback to previous revision:

```bash
helm rollback app -n staging
```

Rollback to specific revision:

```bash
helm rollback app 3 -n staging
```

### Verify Rollback

Monitor rollout status:

```bash
kubectl rollout status deployment/app-api -n staging
kubectl rollout status deployment/app-web -n staging
```

Check pod health:

```bash
kubectl get pods -n staging
kubectl logs -f deployment/app-api -n staging
```

## Docker Compose Rollback

### Using Previous Images

Update `docker-compose.prod.yml` or set environment variables to use previous image tags:

```bash
export API_IMAGE=ghcr.io/yourorg/api:main-abc123
export WEB_IMAGE=ghcr.io/yourorg/web:main-abc123
docker compose -f docker-compose.prod.yml up -d
```

### Manual Container Replacement

Stop current containers:

```bash
docker compose -f docker-compose.prod.yml down
```

Edit `docker-compose.prod.yml` to reference the previous image tags, then restart:

```bash
docker compose -f docker-compose.prod.yml up -d
```

## Database Rollback

### Schema Rollback

If migrations were applied during the deployment:

1. Identify the migrations that were run.
2. Create compensating migrations to reverse changes.
3. Test in staging first.
4. Apply to production after verification.

**Note:** Some migrations (e.g., dropping columns with data) are not easily reversible. Always back up data before running destructive migrations.

### Data Restoration

For critical issues involving data corruption:

1. Stop the application to prevent further writes.
2. Restore database from the most recent backup.
3. Replay transaction logs if available (PostgreSQL PITR).
4. Restart the application.

### Postgres Point-in-Time Recovery (PITR)

If continuous archiving is enabled:

```bash
# Stop postgres
pg_basebackup -D /var/lib/postgresql/data-restore
# Configure recovery.conf
psql -c "SELECT pg_start_backup('restore');"
# Restore to specific timestamp
# Restart postgres
```

## Rollback Checklist

Before rolling back:

- [ ] Identify the root cause of the issue.
- [ ] Determine the last known good version.
- [ ] Notify the team via chat/incident management system.
- [ ] Create an incident ticket for tracking.

During rollback:

- [ ] Execute rollback commands (Helm or Docker Compose).
- [ ] Monitor pod/container status and logs.
- [ ] Verify application health checks and smoke tests.
- [ ] Check database connectivity and query performance.

After rollback:

- [ ] Confirm service is stable and operational.
- [ ] Review logs and metrics to understand the failure.
- [ ] Update incident ticket with rollback details.
- [ ] Conduct a post-mortem to prevent future occurrences.
- [ ] Fix the issue and re-deploy when ready.

## Rollback Time Estimates

| Deployment Method | Typical Rollback Time |
|-------------------|----------------------|
| Helm (Kubernetes) | 2-5 minutes |
| Docker Compose | 1-3 minutes |
| Database Restore | 10-60 minutes (depends on size) |

## Prevention Best Practices

1. **Use blue-green or canary deployments** to minimize impact.
2. **Enable automated health checks** to detect issues early.
3. **Run comprehensive tests in staging** before production deployment.
4. **Implement feature flags** to disable problematic features without redeployment.
5. **Maintain backups** with automated snapshots and transaction logs.
6. **Use immutable infrastructure** with versioned artifacts for easy rollback.
7. **Document rollback procedures** and practice them regularly.

## Emergency Contacts

In case of critical production issues:

- On-call Engineer: [Your contact info]
- DevOps Team: [Slack channel / email]
- Incident Management: [PagerDuty / Opsgenie link]

## Additional Resources

- [Helm Rollback Documentation](https://helm.sh/docs/helm/helm_rollback/)
- [Kubernetes Deployment Rollback](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#rolling-back-a-deployment)
- [PostgreSQL Backup and Restore](https://www.postgresql.org/docs/current/backup.html)
