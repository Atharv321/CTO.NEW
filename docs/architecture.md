# Architecture Overview

This document provides a high-level overview of the application architecture, infrastructure, and deployment pipeline.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         End Users                            │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │   Load Balancer /   │
         │      Ingress        │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │    Web Service      │
         │  (Node.js/Express)  │
         │    Port: 3000       │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │    API Service      │
         │  (Node.js/Express)  │
         │    Port: 3001       │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │   PostgreSQL DB     │
         │    Port: 5432       │
         └─────────────────────┘
```

## Component Overview

### Web Service
- **Technology**: Node.js + Express
- **Purpose**: Serve static HTML/CSS/JS files
- **Port**: 3000
- **Health Check**: `/health` endpoint
- **Dependencies**: API Service for backend calls

### API Service
- **Technology**: Node.js + Express
- **Purpose**: REST API for business logic and database operations
- **Port**: 3001
- **Health Check**: `/health` endpoint
- **Dependencies**: PostgreSQL database

### Database
- **Technology**: PostgreSQL 15
- **Purpose**: Persistent data storage
- **Port**: 5432
- **Managed via**: Cloud provider (AWS RDS, Google Cloud SQL, etc.) or self-hosted

## Infrastructure Layers

### Local Development
- Docker Compose orchestration
- Volumes for database persistence
- Hot-reloading for code changes
- Local environment variables

### Staging Environment
- Kubernetes cluster (3 nodes minimum)
- Managed PostgreSQL database
- Ingress with TLS/SSL
- Resource limits: CPU 250m, Memory 256Mi per pod
- 1 replica per service

### Production Environment
- Kubernetes cluster (5+ nodes)
- High-availability PostgreSQL with replication
- Ingress with TLS/SSL and WAF
- Resource limits: CPU 1000m, Memory 1Gi per pod
- 3+ replicas per service with horizontal autoscaling
- Auto-scaling: min 3, max 20 replicas

## Deployment Flow

```
┌──────────────┐
│  Developer   │
│  Git Push    │
└───────┬──────┘
        │
        ▼
┌────────────────────┐
│  GitHub Actions    │
│   CI/CD Pipeline   │
└────────┬───────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌──────────────┐   ┌──────────────┐
│  Build API   │   │  Build Web   │
│    Image     │   │    Image     │
└───────┬──────┘   └───────┬──────┘
        │                  │
        └────────┬─────────┘
                 │
                 ▼
        ┌────────────────┐
        │ Run Migrations │
        └────────┬───────┘
                 │
                 ▼
        ┌────────────────┐
        │ Deploy Staging │
        │   (K8s/Helm)   │
        └────────┬───────┘
                 │
                 ▼
        ┌────────────────┐
        │ Manual Approval│
        └────────┬───────┘
                 │
                 ▼
        ┌────────────────┐
        │   Production   │
        │  Migrations    │
        └────────┬───────┘
                 │
                 ▼
        ┌────────────────┐
        │Deploy Production│
        │   (K8s/Helm)   │
        └────────────────┘
```

## Container Registry

- **Registry**: GitHub Container Registry (GHCR)
- **Image Naming**:
  - API: `ghcr.io/<org>/<repo>/api:<tag>`
  - Web: `ghcr.io/<org>/<repo>/web:<tag>`
- **Tagging Strategy**:
  - Git SHA for immutability (e.g., `abc123def456`)
  - `latest` for convenience (updated on each main build)

## Network Architecture

### Local Development

```
┌──────────────────────┐
│  Docker Network      │
│  (bridge mode)       │
│                      │
│  ┌────────────────┐  │
│  │  web:3000      │  │
│  └────────┬───────┘  │
│           │          │
│  ┌────────▼───────┐  │
│  │  api:3001      │  │
│  └────────┬───────┘  │
│           │          │
│  ┌────────▼───────┐  │
│  │  db:5432       │  │
│  └────────────────┘  │
└──────────────────────┘
```

### Kubernetes (Staging/Production)

```
┌─────────────────────────────────────────────────────┐
│                  Kubernetes Cluster                 │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │              Ingress Controller               │ │
│  │         (nginx / Traefik / etc.)              │ │
│  └─────────────────┬─────────────────────────────┘ │
│                    │                                │
│  ┌─────────────────▼─────────────────────────────┐ │
│  │           Web Service (ClusterIP)             │ │
│  │           Pods: 1-3 replicas                  │ │
│  └─────────────────┬─────────────────────────────┘ │
│                    │                                │
│  ┌─────────────────▼─────────────────────────────┐ │
│  │           API Service (ClusterIP)             │ │
│  │           Pods: 1-20 replicas                 │ │
│  │           (with autoscaling)                  │ │
│  └─────────────────┬─────────────────────────────┘ │
│                    │                                │
└────────────────────┼────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────┐
          │  Managed          │
          │  PostgreSQL       │
          │  (External)       │
          └──────────────────┘
```

## Secrets Management

### Local Development
- `.env` files (gitignored)
- Docker Compose environment variables

### Staging/Production
- Kubernetes Secrets (base64 encoded in etcd)
- External Secret Managers (recommended):
  - AWS Secrets Manager
  - HashiCorp Vault
  - Google Cloud Secret Manager
  - Azure Key Vault

### GitHub Actions
- GitHub repository secrets for CI/CD
- Scoped to specific environments (staging, production)

## Monitoring & Observability

### Recommended Tools

1. **Metrics**: Prometheus + Grafana
   - CPU, memory, request rates
   - Pod health and restarts
   - Database connection pool

2. **Logging**: ELK Stack or Loki
   - Centralized log aggregation
   - Structured logging with JSON
   - Log retention policies

3. **Tracing**: Jaeger or Zipkin
   - Distributed request tracing
   - Performance bottleneck identification

4. **Alerting**: Alertmanager or PagerDuty
   - Deployment failures
   - High error rates
   - Resource exhaustion

## Scaling Strategy

### Horizontal Pod Autoscaling (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### Database Scaling
- **Vertical Scaling**: Increase instance size
- **Read Replicas**: Distribute read load
- **Connection Pooling**: PgBouncer or pgpool
- **Partitioning**: Table partitioning for large datasets

## High Availability

### Application Layer
- Multiple replicas (3+ in production)
- Anti-affinity rules to spread pods across nodes
- Pod Disruption Budgets (PDB) to ensure minimum availability

### Database Layer
- Multi-AZ deployment
- Automated backups with point-in-time recovery
- Failover replicas
- Monitoring and alerting for connection failures

### Network Layer
- Multiple availability zones
- Load balancer health checks
- DNS failover
- CDN for static assets

## Security Considerations

1. **Network Policies**: Restrict inter-pod communication
2. **RBAC**: Role-based access control for Kubernetes
3. **Pod Security Standards**: Enforce security best practices
4. **Image Scanning**: Automated vulnerability scanning in CI/CD
5. **TLS/SSL**: Encrypted communication (Ingress, database)
6. **Secrets Encryption**: Encrypt secrets at rest in etcd
7. **Audit Logging**: Track API access and changes

## Disaster Recovery

### Backup Strategy
- **Database**: Daily automated backups, 30-day retention
- **Configuration**: GitOps - all config in version control
- **Secrets**: Replicated to DR region

### Recovery Time Objectives (RTO)
- **Staging**: 1-2 hours
- **Production**: 15-30 minutes

### Recovery Point Objectives (RPO)
- **Database**: 5 minutes (via continuous archiving)
- **Application State**: 0 (stateless)

### DR Procedures
1. Restore database from backup or replica promotion
2. Deploy application using last known good images
3. Verify health checks and smoke tests
4. Switch DNS to DR region if necessary

## Cost Optimization

1. **Right-sizing**: Match resource requests to actual usage
2. **Autoscaling**: Scale down during off-peak hours
3. **Reserved Instances**: Commit to base capacity
4. **Spot Instances**: Use for non-critical workloads
5. **Resource Quotas**: Prevent resource waste
6. **Image Optimization**: Multi-stage builds, Alpine base images
