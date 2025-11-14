# Reminder Worker Quick Reference

## Quick Commands

### Start Services

```bash
# Development - All services with Docker Compose
docker-compose up -d

# Development - API and Worker separately
cd apps/api
npm run dev           # Terminal 1: API server
npm run dev:worker    # Terminal 2: Worker

# Production
pm2 start dist/index.js --name api
pm2 start dist/worker.js --name worker -i 3  # 3 instances
```

### Monitor

```bash
# Queue statistics
curl http://localhost:3000/api/queue/stats

# Worker logs
docker logs monorepo-worker -f
pm2 logs worker

# Redis queue
docker exec -it monorepo-redis redis-cli
> LLEN bull:booking-reminders:wait
> KEYS bull:booking-reminders:*
```

### Test

```bash
# Run all tests
npm test

# Specific test suites
npm test -- __tests__/unit
npm test -- __tests__/integration

# Coverage
npm test -- --coverage
```

## API Quick Reference

### Create Booking (Schedules Reminders)
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "+1234567890",
    "serviceId": "haircut",
    "barberId": "barber_1",
    "scheduledTime": "2024-12-31T10:00:00Z"
  }'
```

### Update Booking (Reschedules Reminders)
```bash
curl -X PATCH http://localhost:3000/api/bookings/booking_123 \
  -H "Content-Type: application/json" \
  -d '{"scheduledTime": "2024-12-31T14:00:00Z"}'
```

### Cancel Booking (Cancels Reminders)
```bash
curl -X DELETE http://localhost:3000/api/bookings/booking_123
```

### Check Reminder Status
```bash
curl http://localhost:3000/api/bookings/booking_123/reminders
```

## Configuration Quick Reference

### Environment Variables
```bash
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# WhatsApp
WHATSAPP_ACCOUNT_SID=your_sid
WHATSAPP_AUTH_TOKEN=your_token
WHATSAPP_FROM_NUMBER=+1234567890
```

### Retry Configuration
- **Attempts**: 5
- **Strategy**: Exponential backoff
- **Delays**: 5s, 25s, 125s, 625s, 3125s

### Scheduling Logic
- **Interval**: Every 2 hours
- **Minimum Notice**: 2 hours before appointment
- **Job ID Format**: `{bookingId}-reminder-{number}`

## Troubleshooting Quick Fixes

### Worker Not Processing
```bash
pm2 restart worker
docker-compose restart worker
```

### Clear Failed Jobs
```bash
docker exec -it monorepo-redis redis-cli
> DEL bull:booking-reminders:failed
```

### Scale Workers
```bash
pm2 scale worker 5
```

## Key Files

| File | Purpose |
|------|---------|
| `src/worker.ts` | Worker entry point |
| `src/queues/reminder.queue.ts` | Queue management |
| `src/workers/reminder.worker.ts` | Job processor |
| `src/services/whatsapp.service.ts` | WhatsApp integration |
| `src/templates/whatsapp-messages.ts` | Message templates |
| `docs/reminder-worker-runbook.md` | Full documentation |

## Health Checks

```bash
# API health
curl http://localhost:3000/health

# Queue stats
curl http://localhost:3000/api/queue/stats

# Redis ping
docker exec monorepo-redis redis-cli ping
```

## Message Template Variables

Available in message templates:
- `{customerName}` - Customer name
- `{formattedDateTime}` - Formatted appointment date/time
- `{timeUntil}` - Human-readable time until appointment
- `{serviceName}` - Service name (optional)
- `{barberName}` - Barber name (optional)

## Phone Number Format

Must be E.164 format:
- ✅ `+1234567890`
- ✅ `+447911123456`
- ❌ `1234567890` (missing +)
- ❌ `+0123456789` (invalid country code)

## Common Issues

| Issue | Quick Fix |
|-------|-----------|
| Worker not processing | Restart worker, check Redis connection |
| Duplicate messages | Check job IDs, verify idempotency logic |
| Messages not sending | Verify WhatsApp credentials, check phone format |
| High failure rate | Review API rate limits, check error logs |

## Performance Tuning

```typescript
// Worker concurrency (reminder.worker.ts)
concurrency: 5  // Increase for more parallel processing

// Rate limiting (reminder.worker.ts)
limiter: {
  max: 10,      // Max jobs
  duration: 1000 // Per second
}
```

## Monitoring Metrics

Watch these metrics:
- **Queue Depth**: Should not grow unbounded
- **Failure Rate**: Should be < 1%
- **Processing Rate**: Jobs/minute
- **Redis Memory**: Keep below 80%
- **Worker Health**: All instances running

## Support Contacts

- **Documentation**: `docs/reminder-worker-runbook.md`
- **Logs**: `docker logs` or `pm2 logs`
- **Redis CLI**: `docker exec -it monorepo-redis redis-cli`
