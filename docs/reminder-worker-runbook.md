# Reminder Worker Operational Runbook

## Overview

The Reminder Worker is a background service that schedules and sends WhatsApp reminder messages for bookings. It uses BullMQ with Redis for job scheduling and processing.

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   API       │────────▶│   Redis     │◀────────│   Worker    │
│  Service    │         │   (Queue)   │         │   Service   │
└─────────────┘         └─────────────┘         └─────────────┘
      │                                                 │
      │                                                 │
      ▼                                                 ▼
┌─────────────┐                               ┌─────────────┐
│  Database   │                               │  WhatsApp   │
│             │                               │     API     │
└─────────────┘                               └─────────────┘
```

### Components

1. **API Service** (`apps/api/src/index.ts`)
   - Creates and manages bookings
   - Schedules reminder jobs via the queue
   - Cancels reminders when bookings are updated/cancelled

2. **Worker Service** (`apps/api/src/worker.ts`)
   - Processes reminder jobs from the queue
   - Sends WhatsApp messages
   - Handles retries with exponential backoff

3. **Redis Queue** (BullMQ)
   - Stores scheduled jobs
   - Manages job states and retries
   - Provides job persistence

## Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379

# WhatsApp API Configuration
WHATSAPP_ACCOUNT_SID=your_account_sid
WHATSAPP_AUTH_TOKEN=your_auth_token
WHATSAPP_FROM_NUMBER=+1234567890
WHATSAPP_API_URL=https://api.whatsapp.com

# Application
NODE_ENV=production
API_PORT=3000
```

### Queue Configuration

Located in `apps/api/src/config/redis.ts`:

- **Retry Attempts**: 5
- **Backoff Strategy**: Exponential
- **Initial Delay**: 5 seconds
- **Job Retention**: 24 hours (completed), 7 days (failed)

## Deployment

### Docker Compose (Development)

```bash
# Start all services
docker-compose up -d

# Start worker separately
cd apps/api
npm run dev:worker
```

### Production Deployment

#### 1. Build the Worker

```bash
cd apps/api
npm install
npm run build
```

#### 2. Deploy Worker Service

```bash
# Using systemd
sudo systemctl start reminder-worker
sudo systemctl enable reminder-worker

# Using PM2
pm2 start dist/worker.js --name reminder-worker
pm2 save
```

#### 3. Scale Workers

For high volume, run multiple worker instances:

```bash
pm2 start dist/worker.js -i 3 --name reminder-worker
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: reminder-worker
spec:
  replicas: 3
  selector:
    matchLabels:
      app: reminder-worker
  template:
    metadata:
      labels:
        app: reminder-worker
    spec:
      containers:
      - name: worker
        image: your-registry/api:latest
        command: ["node", "dist/worker.js"]
        env:
        - name: REDIS_HOST
          value: redis-service
        - name: REDIS_PORT
          value: "6379"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

## Operations

### Starting the Worker

```bash
# Development
npm run dev:worker

# Production
npm run start:worker

# With PM2
pm2 start dist/worker.js --name reminder-worker
```

### Stopping the Worker

```bash
# Graceful shutdown (processes current jobs)
pm2 stop reminder-worker

# Kill signal
kill -SIGTERM <pid>
```

The worker handles `SIGTERM` and `SIGINT` signals gracefully, completing in-progress jobs before shutting down.

### Monitoring

#### Queue Statistics

Check queue health via API:

```bash
curl http://localhost:3000/api/queue/stats
```

Response:
```json
{
  "waiting": 10,
  "active": 2,
  "completed": 150,
  "failed": 3,
  "delayed": 45
}
```

#### Worker Logs

```bash
# PM2
pm2 logs reminder-worker

# Docker
docker logs reminder-worker

# Systemd
journalctl -u reminder-worker -f
```

#### Redis Monitoring

```bash
# Connect to Redis CLI
redis-cli

# Check queue keys
KEYS bull:booking-reminders:*

# Check queue length
LLEN bull:booking-reminders:wait

# Get job details
HGETALL bull:booking-reminders:job-id
```

### Metrics to Monitor

1. **Queue Depth**: Number of waiting jobs
2. **Processing Rate**: Jobs completed per minute
3. **Failure Rate**: Failed jobs / total jobs
4. **Worker Health**: Active workers count
5. **Redis Memory**: Memory usage of Redis
6. **Job Latency**: Time from schedule to execution

## Troubleshooting

### Worker Not Processing Jobs

**Symptoms**: Jobs stuck in "waiting" state

**Diagnosis**:
```bash
# Check worker status
pm2 list

# Check worker logs
pm2 logs reminder-worker --lines 100

# Check Redis connection
redis-cli ping
```

**Solutions**:
1. Restart worker: `pm2 restart reminder-worker`
2. Check Redis connectivity
3. Verify environment variables
4. Check worker concurrency settings

### High Failure Rate

**Symptoms**: Many jobs in "failed" state

**Diagnosis**:
```bash
# Check failed jobs
curl http://localhost:3000/api/queue/stats

# Check logs for errors
pm2 logs reminder-worker | grep "ERROR"
```

**Solutions**:
1. Check WhatsApp API credentials
2. Verify phone number formats (E.164)
3. Check API rate limits
4. Review error logs for patterns

### Redis Connection Issues

**Symptoms**: Worker crashes or jobs not being queued

**Diagnosis**:
```bash
# Check Redis status
redis-cli ping

# Check Redis memory
redis-cli INFO memory

# Check connections
redis-cli CLIENT LIST
```

**Solutions**:
1. Restart Redis: `docker-compose restart redis`
2. Check Redis memory limits
3. Verify network connectivity
4. Check Redis authentication

### Jobs Not Being Created

**Symptoms**: No jobs in queue after booking creation

**Diagnosis**:
```bash
# Check API logs
docker logs api-service

# Test booking creation
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test User",
    "customerEmail": "test@example.com",
    "customerPhone": "+1234567890",
    "serviceId": "service_1",
    "barberId": "barber_1",
    "scheduledTime": "2024-12-31T10:00:00Z"
  }'
```

**Solutions**:
1. Check API service logs
2. Verify Redis connection from API
3. Check booking validation logic
4. Ensure scheduledTime is in the future

### Duplicate Messages

**Symptoms**: Customers receiving duplicate reminders

**Diagnosis**:
```bash
# Check for duplicate job IDs
redis-cli KEYS "bull:booking-reminders:*:job-id*"

# Check worker idempotency logic
```

**Solutions**:
1. Verify job ID generation (should be deterministic)
2. Check idempotency logic in worker
3. Review job removal settings
4. Restart workers to clear in-memory cache

## Maintenance

### Daily Tasks

1. **Monitor Queue Depth**: Ensure not growing unbounded
2. **Check Failure Rate**: Should be < 1%
3. **Review Error Logs**: Look for patterns
4. **Verify Worker Health**: All workers running

### Weekly Tasks

1. **Clean Old Jobs**: Automatic, but verify
2. **Review Performance Metrics**
3. **Check Redis Memory Usage**
4. **Update Dependencies**: Security patches

### Monthly Tasks

1. **Performance Review**: Analyze trends
2. **Capacity Planning**: Adjust worker count
3. **Update Documentation**: Reflect changes
4. **Disaster Recovery Test**: Verify backups

## Scaling

### Horizontal Scaling

Add more worker instances:

```bash
# PM2
pm2 scale reminder-worker +2

# Kubernetes
kubectl scale deployment reminder-worker --replicas=5
```

### Vertical Scaling

Adjust worker concurrency in `apps/api/src/workers/reminder.worker.ts`:

```typescript
new Worker(QUEUE_NAME, processor, {
  concurrency: 10, // Increase from 5
});
```

## Disaster Recovery

### Redis Failure

1. **Immediate**: Jobs in progress will fail and retry
2. **Action**: Restore Redis from backup or start new instance
3. **Recovery**: Jobs will be reprocessed on retry

### Complete System Failure

1. **Stop all services**
2. **Restore Redis data from backup**
3. **Start API service**
4. **Start worker service**
5. **Verify queue statistics**
6. **Monitor for duplicate processing**

## Security

### API Authentication

Implement authentication for booking endpoints:

```typescript
app.use('/api/bookings', authMiddleware);
```

### WhatsApp API Credentials

- Store in environment variables
- Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- Rotate credentials regularly
- Never commit to version control

### Redis Security

- Use Redis password authentication
- Enable TLS for Redis connections
- Restrict network access
- Regular security updates

## Performance Optimization

### Tips for High Volume

1. **Increase Worker Concurrency**: More parallel processing
2. **Scale Workers Horizontally**: Multiple instances
3. **Optimize Redis**: Use Redis Cluster for large datasets
4. **Batch Processing**: Group messages where possible
5. **Caching**: Cache frequently accessed data

### Rate Limiting

Adjust rate limits in `apps/api/src/workers/reminder.worker.ts`:

```typescript
limiter: {
  max: 20, // Increase from 10
  duration: 1000,
}
```

## API Endpoints

### Create Booking
```http
POST /api/bookings
Content-Type: application/json

{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1234567890",
  "serviceId": "service_1",
  "barberId": "barber_1",
  "scheduledTime": "2024-12-31T10:00:00Z"
}
```

### Update Booking
```http
PATCH /api/bookings/:id
Content-Type: application/json

{
  "scheduledTime": "2024-12-31T14:00:00Z"
}
```

### Cancel Booking
```http
DELETE /api/bookings/:id
```

### Get Reminder Status
```http
GET /api/bookings/:id/reminders
```

### Get Queue Stats
```http
GET /api/queue/stats
```

## Support

### Contact

- **On-Call Engineer**: Use PagerDuty
- **Team Slack**: #reminder-worker-alerts
- **Email**: ops@example.com

### Escalation

1. **Level 1**: On-call engineer (response: 15 min)
2. **Level 2**: Senior engineer (response: 30 min)
3. **Level 3**: Engineering manager (response: 1 hour)

## Changelog

### Version 1.0.0 (2024-01-01)
- Initial release
- Basic reminder scheduling
- Exponential backoff retries
- Idempotency support
- WhatsApp integration

## References

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Documentation](https://redis.io/documentation)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Express.js Documentation](https://expressjs.com/)
