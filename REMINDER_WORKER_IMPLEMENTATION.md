# Reminder Worker Implementation Summary

## Overview

This document summarizes the implementation of the reminder worker system for automated WhatsApp notifications for bookings.

## What Was Implemented

### 1. Background Worker System ✅
- **Location**: `apps/api/src/worker.ts`
- **Technology**: BullMQ with Redis
- **Functionality**: Processes scheduled reminder jobs separately from the main API

### 2. Job Scheduling ✅
- **Location**: `apps/api/src/queues/reminder.queue.ts`
- **Schedule**: Reminders every 2 hours post-booking until appointment time
- **Logic**: 
  - Calculates hours until appointment
  - Schedules reminders at 2-hour intervals
  - Stops scheduling reminders at appointment time
  - Skips scheduling if appointment is < 2 hours away

### 3. WhatsApp Integration ✅
- **Location**: `apps/api/src/services/whatsapp.service.ts`
- **Features**:
  - Phone number validation (E.164 format)
  - Rate limiting (1 second between messages)
  - Mock implementation ready for production API integration
  - Health check functionality

### 4. Message Templates ✅
- **Location**: `apps/api/src/templates/whatsapp-messages.ts`
- **Templates**:
  - Reminder message with appointment details
  - Cancellation confirmation message
  - Dynamic content (service name, barber name, time until appointment)

### 5. Idempotency ✅
- **Implementation**: 
  - Deterministic job IDs: `{bookingId}-reminder-{number}`
  - In-memory tracking of processed jobs
  - Prevents duplicate reminders if jobs are retried

### 6. Cancellation Handling ✅
- **Location**: `apps/api/src/services/booking.service.ts`
- **Features**:
  - Automatic cancellation when booking is cancelled
  - Automatic rescheduling when booking is updated
  - Removes all pending reminders from queue

### 7. Retry Logic with Exponential Backoff ✅
- **Configuration**: `apps/api/src/config/redis.ts`
- **Settings**:
  - 5 retry attempts
  - Exponential backoff starting at 5 seconds
  - Delays: 5s, 25s, 125s, 625s, 3125s

### 8. API Endpoints ✅
- **POST /api/bookings** - Create booking and schedule reminders
- **PATCH /api/bookings/:id** - Update booking and reschedule reminders
- **DELETE /api/bookings/:id** - Cancel booking and reminders
- **GET /api/bookings/:id/reminders** - Get reminder status
- **GET /api/queue/stats** - Get queue statistics

### 9. Tests ✅
- **Unit Tests**:
  - `__tests__/unit/whatsapp-messages.test.ts` - Message template tests
  - `__tests__/unit/whatsapp.service.test.ts` - WhatsApp service tests
  - `__tests__/unit/reminder.queue.test.ts` - Queue logic tests
  - `__tests__/unit/retry-logic.test.ts` - Retry and idempotency tests
  
- **Integration Tests**:
  - `__tests__/integration/booking-reminders.test.ts` - End-to-end flow tests

### 10. Documentation ✅
- **`apps/api/README.md`** - Quick start guide and API documentation
- **`docs/reminder-worker-runbook.md`** - Comprehensive operational runbook
- **`docs/reminder-worker-quick-reference.md`** - Quick reference for common tasks

### 11. Docker Configuration ✅
- **Updated `docker-compose.yml`** with worker service
- **Updated `.env.example`** with WhatsApp and Redis configuration
- Worker runs as separate container in development

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Booking Created                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              API Service (apps/api/src/index.ts)            │
│  - Validates booking                                        │
│  - Creates booking record                                   │
│  - Calls BookingService.createBooking()                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│       Booking Service (services/booking.service.ts)         │
│  - Calculates reminder times                                │
│  - Calls ReminderQueue.scheduleReminders()                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│         Reminder Queue (queues/reminder.queue.ts)           │
│  - Creates jobs with deterministic IDs                      │
│  - Schedules jobs with delays                               │
│  - Stores in Redis (BullMQ)                                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Redis (Job Queue)                        │
│  - Stores scheduled jobs                                    │
│  - Manages job states                                       │
│  - Triggers jobs at scheduled time                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│      Reminder Worker (workers/reminder.worker.ts)           │
│  - Listens for jobs from Redis                              │
│  - Checks idempotency                                       │
│  - Formats message using templates                          │
│  - Calls WhatsAppService.sendMessage()                      │
│  - Handles retries with exponential backoff                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│      WhatsApp Service (services/whatsapp.service.ts)        │
│  - Validates phone number                                   │
│  - Applies rate limiting                                    │
│  - Sends message via WhatsApp API                           │
│  - Returns success/failure                                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Customer Receives Message                 │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
apps/api/
├── src/
│   ├── config/
│   │   └── redis.ts                    # Redis and queue configuration
│   ├── models/
│   │   └── booking.ts                  # TypeScript interfaces
│   ├── queues/
│   │   └── reminder.queue.ts           # Queue management
│   ├── workers/
│   │   └── reminder.worker.ts          # Job processor
│   ├── services/
│   │   ├── booking.service.ts          # Booking business logic
│   │   └── whatsapp.service.ts         # WhatsApp integration
│   ├── templates/
│   │   └── whatsapp-messages.ts        # Message templates
│   ├── __tests__/
│   │   ├── unit/
│   │   │   ├── whatsapp-messages.test.ts
│   │   │   ├── whatsapp.service.test.ts
│   │   │   ├── reminder.queue.test.ts
│   │   │   └── retry-logic.test.ts
│   │   └── integration/
│   │       └── booking-reminders.test.ts
│   ├── index.ts                        # API entry point
│   └── worker.ts                       # Worker entry point
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md

docs/
├── reminder-worker-runbook.md          # Full operational documentation
└── reminder-worker-quick-reference.md  # Quick commands and tips
```

## Key Features

### Reminder Scheduling Logic

**Example**: Booking at 10:00 AM, created at 12:00 AM
- 10 hours until appointment
- 5 reminders scheduled (10 ÷ 2 = 5)
- Reminder times:
  - 1st: 2:00 AM (2 hours after booking)
  - 2nd: 4:00 AM (4 hours after booking)
  - 3rd: 6:00 AM (6 hours after booking)
  - 4th: 8:00 AM (8 hours after booking)
  - 5th: Would be at 10:00 AM, but skipped (at appointment time)

### Idempotency

Job IDs are deterministic:
```
booking_123-reminder-1
booking_123-reminder-2
booking_123-reminder-3
```

This ensures:
- Same job ID if booking created multiple times
- Worker can detect already-processed jobs
- Retries don't create new jobs

### Retry Strategy

| Attempt | Delay    | Total Wait Time |
|---------|----------|-----------------|
| 1       | 0s       | 0s              |
| 2       | 5s       | 5s              |
| 3       | 25s      | 30s             |
| 4       | 125s     | 155s (~2.5m)    |
| 5       | 625s     | 780s (~13m)     |
| Failed  | 3125s    | 3905s (~65m)    |

## Configuration

### Environment Variables

```bash
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# WhatsApp (replace with actual credentials)
WHATSAPP_ACCOUNT_SID=your_account_sid
WHATSAPP_AUTH_TOKEN=your_auth_token
WHATSAPP_FROM_NUMBER=+1234567890
WHATSAPP_API_URL=https://api.whatsapp.com
```

### Queue Settings

```typescript
{
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 5000, // 5 seconds
  },
  removeOnComplete: {
    age: 86400, // 24 hours
    count: 1000,
  },
  removeOnFail: {
    age: 604800, // 7 days
  },
}
```

## Running the System

### Development

```bash
# Start all services with Docker Compose
docker-compose up

# Or run separately:
# Terminal 1: API
cd apps/api
npm run dev

# Terminal 2: Worker
cd apps/api
npm run dev:worker
```

### Production

```bash
# Build
npm run build

# Start with PM2
pm2 start dist/index.js --name api
pm2 start dist/worker.js --name worker -i 3  # 3 worker instances
```

## Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- __tests__/unit
npm test -- __tests__/integration

# With coverage
npm test -- --coverage
```

## Monitoring

### Queue Statistics

```bash
curl http://localhost:3000/api/queue/stats
```

Response:
```json
{
  "waiting": 15,
  "active": 3,
  "completed": 250,
  "failed": 2,
  "delayed": 42
}
```

### Reminder Status for Booking

```bash
curl http://localhost:3000/api/bookings/booking_123/reminders
```

Response:
```json
[
  {
    "jobId": "booking_123-reminder-1",
    "state": "completed",
    "scheduledFor": "2024-12-31T06:00:00Z"
  },
  {
    "jobId": "booking_123-reminder-2",
    "state": "waiting",
    "scheduledFor": "2024-12-31T08:00:00Z"
  }
]
```

## Next Steps for Production

1. **WhatsApp API Integration**
   - Replace mock implementation in `whatsapp.service.ts`
   - Add actual API client (Twilio, WhatsApp Business API, etc.)
   - Configure credentials in environment

2. **Database Integration**
   - Add PostgreSQL models for bookings
   - Store booking and reminder history
   - Query booking details for reminders

3. **Authentication**
   - Add API authentication middleware
   - Protect booking endpoints
   - Rate limiting per user

4. **Monitoring**
   - Set up logging (Winston, Pino)
   - Add metrics (Prometheus, DataDog)
   - Configure alerts for failures

5. **Testing**
   - Add more integration tests with real Redis
   - Load testing for high volume
   - End-to-end tests with test WhatsApp numbers

## Support

- **Quick Reference**: `docs/reminder-worker-quick-reference.md`
- **Full Documentation**: `docs/reminder-worker-runbook.md`
- **API Docs**: `apps/api/README.md`

## License

Internal use only
