# API Service with Reminder Worker

This API service provides booking management with automated WhatsApp reminder functionality.

## Features

- 📅 **Booking Management**: Create, update, and cancel bookings
- 🔔 **Automated Reminders**: WhatsApp reminders sent every 2 hours until appointment
- 🔄 **Retry Logic**: Exponential backoff for failed message deliveries
- 🎯 **Idempotency**: Prevents duplicate reminders
- 🚫 **Smart Cancellation**: Automatically cancels reminders when bookings change
- 📊 **Queue Monitoring**: Real-time statistics and job status

## Architecture

```
Booking Created → Queue Jobs → Worker Processes → WhatsApp API
     ↓              (Redis)         ↓                  ↓
  Database      ← Job Status ← Retries (exponential) → Customer
```

## Quick Start

### Prerequisites

- Node.js 18+
- Redis (for job queue)
- WhatsApp Business API credentials

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# WhatsApp API
WHATSAPP_ACCOUNT_SID=your_sid
WHATSAPP_AUTH_TOKEN=your_token
WHATSAPP_FROM_NUMBER=+1234567890
```

### Running Locally

Start the API server:
```bash
npm run dev
```

Start the worker (in separate terminal):
```bash
npm run dev:worker
```

### Using Docker Compose

```bash
# Start all services (API, Worker, Redis)
docker-compose up

# Or start in background
docker-compose up -d
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
  "serviceId": "haircut",
  "barberId": "barber_1",
  "scheduledTime": "2024-12-31T10:00:00Z"
}
```

**Response:**
```json
{
  "id": "booking_123",
  "customerName": "John Doe",
  "customerPhone": "+1234567890",
  "scheduledTime": "2024-12-31T10:00:00Z",
  "status": "confirmed",
  "createdAt": "2024-01-01T12:00:00Z"
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

**Response:**
```json
[
  {
    "jobId": "booking_123-reminder-1",
    "state": "waiting",
    "scheduledFor": "2024-12-31T08:00:00Z"
  },
  {
    "jobId": "booking_123-reminder-2",
    "state": "completed",
    "scheduledFor": "2024-12-31T06:00:00Z"
  }
]
```

### Get Queue Statistics

```http
GET /api/queue/stats
```

**Response:**
```json
{
  "waiting": 15,
  "active": 3,
  "completed": 250,
  "failed": 2,
  "delayed": 42
}
```

## Reminder Logic

### Scheduling

When a booking is created:
1. Calculate hours until appointment
2. Schedule reminders every 2 hours
3. Stop scheduling reminders at appointment time

**Example:** Booking at 10:00 AM, created at 12:00 AM
- First reminder: 2:00 AM
- Second reminder: 4:00 AM
- Third reminder: 6:00 AM
- Fourth reminder: 8:00 AM
- No more reminders (next would be after appointment)

### Cancellation

When a booking is updated or cancelled:
1. Cancel all pending reminders
2. If updated and still confirmed, reschedule new reminders
3. Already sent reminders are not affected

### Idempotency

Job IDs are deterministic: `{bookingId}-reminder-{number}`

This ensures:
- No duplicate jobs if booking created twice
- Worker can detect and skip already-processed jobs
- Retries don't create new jobs

### Retry Strategy

Failed message deliveries are retried with exponential backoff:

| Attempt | Delay  |
|---------|--------|
| 1       | 5s     |
| 2       | 25s    |
| 3       | 125s   |
| 4       | 625s   |
| 5       | 3125s  |

After 5 attempts, the job moves to failed state.

## Testing

### Run Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
# Unit tests
npm test -- __tests__/unit

# Integration tests
npm test -- __tests__/integration
```

### Test Coverage

```bash
npm test -- --coverage
```

## Message Templates

### Reminder Message

```
Hello {customerName}! 👋

This is a reminder about your upcoming appointment.

📅 Date & Time: {formattedDateTime}
✂️ Service: {serviceName}
💈 Barber: {barberName}

⏰ Your appointment is in {timeUntil}

Please arrive 5-10 minutes early.
Reply CANCEL to cancel this appointment.

We look forward to seeing you! 💯
```

### Cancellation Message

```
Hello {customerName},

Your appointment scheduled for {formattedDateTime} has been cancelled.

If this was a mistake, please contact us to reschedule.

Thank you! 🙏
```

## Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

### Queue Stats

```bash
curl http://localhost:3000/api/queue/stats
```

### Logs

View API logs:
```bash
docker logs monorepo-api -f
```

View worker logs:
```bash
docker logs monorepo-worker -f
```

### Redis Monitoring

```bash
# Connect to Redis
docker exec -it monorepo-redis redis-cli

# View queue keys
KEYS bull:booking-reminders:*

# Check queue length
LLEN bull:booking-reminders:wait
```

## Production Deployment

### Build

```bash
npm run build
```

### Start Production Server

```bash
# Start API
npm start

# Start Worker (separate process)
npm run start:worker
```

### Using Process Manager

```bash
# Install PM2
npm install -g pm2

# Start services
pm2 start dist/index.js --name api
pm2 start dist/worker.js --name worker

# Scale worker
pm2 scale worker 3

# Save configuration
pm2 save
```

### Environment Variables

Production requires:
- `NODE_ENV=production`
- Valid WhatsApp API credentials
- Redis connection string
- Database connection (if using)

## Troubleshooting

### Worker not processing jobs

1. Check worker is running: `docker ps` or `pm2 list`
2. Check Redis connection: `docker logs monorepo-redis`
3. Verify environment variables
4. Check worker logs for errors

### Messages not being sent

1. Verify WhatsApp API credentials
2. Check phone number format (must be E.164)
3. Review API rate limits
4. Check worker logs for errors

### Duplicate messages

1. Verify job IDs are unique
2. Check idempotency logic in worker
3. Ensure Redis persistence
4. Review worker scaling configuration

## Development

### Project Structure

```
src/
├── config/           # Configuration files
│   └── redis.ts      # Redis and queue config
├── models/           # Data models
│   └── booking.ts    # Booking and job types
├── queues/           # Queue definitions
│   └── reminder.queue.ts
├── workers/          # Worker processors
│   └── reminder.worker.ts
├── services/         # Business logic
│   ├── booking.service.ts
│   └── whatsapp.service.ts
├── templates/        # Message templates
│   └── whatsapp-messages.ts
├── __tests__/        # Test files
│   ├── unit/
│   └── integration/
├── index.ts          # API entry point
└── worker.ts         # Worker entry point
```

### Adding New Features

1. **New Message Template**: Add to `templates/whatsapp-messages.ts`
2. **New Queue**: Create in `queues/` and add worker processor
3. **New Endpoint**: Add to `index.ts` with proper validation
4. **New Test**: Add to appropriate `__tests__/` directory

## Documentation

- [Operational Runbook](../../docs/reminder-worker-runbook.md)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Documentation](https://redis.io/documentation)

## Support

For issues and questions:
- Check the [Operational Runbook](../../docs/reminder-worker-runbook.md)
- Review logs for error messages
- Contact the development team

## License

Internal use only
