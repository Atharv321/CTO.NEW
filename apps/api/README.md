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
# Restaurant Inventory Analytics API

A comprehensive analytics backend for restaurant inventory management, providing reporting services for inventory valuation, turnover, wastage, and location performance.

## Features

### Core Analytics
- **Inventory Valuation**: Real-time inventory value calculation with category breakdowns
- **Inventory Turnover**: Track inventory movement and days of supply
- **Wastage Reporting**: Monitor waste with detailed item-level analysis
- **Location Performance**: Comprehensive KPI dashboard for multi-location analysis

### Advanced Features
- **Caching Strategy**: Redis-based caching with configurable TTL
- **Scheduled Jobs**: Automated daily/weekly/monthly snapshot generation
- **Chart-Friendly APIs**: Optimized data structures for frontend visualization
- **Role-Based Access Control**: Granular permissions for different user roles

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (admin only)
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/users` - List all users (admin/manager)
- `PATCH /api/auth/users/:id/role` - Update user role (admin only)

#### Analytics
- `GET /api/analytics/valuation` - Inventory valuation data
- `GET /api/analytics/turnover` - Inventory turnover metrics
- `GET /api/analytics/wastage` - Wastage reports
- `GET /api/analytics/performance` - Location performance KPIs

#### Chart Data
- `GET /api/analytics/charts/valuation` - Valuation chart data
- `GET /api/analytics/charts/turnover` - Turnover chart data
- `GET /api/analytics/charts/wastage` - Wastage chart data
- `GET /api/analytics/charts/performance` - Performance chart data

#### Cache Management
- `POST /api/analytics/cache/clear` - Clear analytics cache

#### Scheduler (Admin Only)
- `GET /api/scheduler/tasks` - List active scheduled tasks
- `POST /api/scheduler/trigger/:type` - Manual snapshot trigger

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
- Node.js 18+
- PostgreSQL 12+
- Redis 6+

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database and Redis credentials
   ```

3. **Run database migrations**
   ```bash
   npm run migrate
   ```

4. **Seed database with test data**
   ```bash
   node --loader tsx/cjs src/database/seed.ts
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## API Usage Examples

### Authentication

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@restaurant.com", "password": "password123"}'

# Response
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@restaurant.com",
      "name": "Admin User",
      "role": "admin"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### Analytics Queries

```bash
# Get inventory valuation
curl -X GET "http://localhost:3000/api/analytics/valuation?period=monthly&locationIds=uuid1,uuid2" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get chart data
curl -X GET "http://localhost:3000/api/analytics/charts/valuation?period=weekly" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response Format

All analytics endpoints return chart-friendly data:

```json
{
  "success": true,
  "data": [
    {
      "locationId": "uuid",
      "locationName": "Main Restaurant",
      "totalValue": 15420.50,
      "totalItems": 342,
      "categoryBreakdown": [
        {
          "category": "Vegetables",
          "value": 3250.00,
          "itemCount": 120,
          "percentage": 21.1
        }
      ],
      "date": "2024-01-15"
    }
  ]
}
```

Chart data endpoints return:
```json
{
  "success": true,
  "data": {
    "labels": ["Main Restaurant", "Downtown Branch"],
    "datasets": [
      {
        "label": "Inventory Value ($)",
        "data": [15420.50, 12350.75],
        "backgroundColor": "rgba(54, 162, 235, 0.6)",
        "borderColor": "rgba(54, 162, 235, 1)"
      }
    ]
  }
}
```

## Query Parameters

### Common Parameters
- `locationIds` - Comma-separated list of location UUIDs
- `startDate` - ISO date string (YYYY-MM-DD)
- `endDate` - ISO date string (YYYY-MM-DD)
- `period` - `daily`, `weekly`, or `monthly` (default: monthly)
- `category` - Filter by product category

### Examples
```bash
# Monthly report for specific locations
GET /api/analytics/valuation?period=monthly&locationIds=uuid1,uuid2

# Date range query
GET /api/analytics/wastage?startDate=2024-01-01&endDate=2024-01-31

# Category filter
GET /api/analytics/valuation?category=Vegetables&period=weekly
```

## User Roles

### Role Hierarchy
1. **Admin** - Full access to all features
2. **Manager** - Access to analytics and user management
3. **Analyst** - Access to analytics only
4. **Staff** - No analytics access

### Permissions
- **Analytics Access**: Admin, Manager, Analyst
- **Scheduler Management**: Admin only
- **User Management**: Admin, Manager
- **Full API Access**: Admin only

## Caching Strategy

### Cache Keys
- `inventory_valuation:{params_hash}`
- `inventory_turnover:{params_hash}`
- `wastage_report:{params_hash}`
- `location_performance:{params_hash}`

### TTL Configuration
- Analytics data: 10-30 minutes
- Chart data: 30 minutes
- User sessions: 15 minutes

### Cache Invalidation
- Manual: `POST /api/analytics/cache/clear`
- Automatic: Hourly cleanup job
- Event-driven: After inventory updates

## Scheduled Jobs

### Default Schedule
- **Daily Snapshot**: 2:00 AM UTC
- **Weekly Snapshot**: Sunday 3:00 AM UTC  
- **Monthly Snapshot**: 1st day 4:00 AM UTC
- **Cache Cleanup**: Every hour

### Snapshot Data
Stored in `analytics_snapshots` table:
- Location metrics
- Period-based aggregations
- Historical performance data
- Trend analysis data

## Testing

### Run Tests
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Coverage
npm run test:coverage
```

### Test Data
The test suite includes comprehensive seed data:
- Multiple locations
- Diverse product catalog
- Historical stock movements
- User accounts with different roles

### Test Coverage
- ✅ Analytics calculations
- ✅ Chart data generation
- ✅ Authentication & authorization
- ✅ Caching mechanisms
- ✅ Error handling
- ✅ API endpoint responses

## Architecture

### Service Structure
```
src/
├── database/          # Database connection and migrations
├── middleware/        # Authentication and validation
├── routes/           # API route handlers
├── services/         # Business logic services
├── tests/            # Test suites
└── types/            # TypeScript type definitions
```

### Key Services
- **AnalyticsService**: Core analytics calculations
- **CacheService**: Redis caching layer
- **AuthService**: Authentication and authorization
- **SchedulerService**: Background job management

### Database Schema
- `users` - User management
- `locations` - Restaurant locations
- `products` - Product catalog
- `inventory_items` - Current inventory levels
- `stock_movements` - Transaction history
- `analytics_snapshots` - Pre-calculated aggregates

## Performance

### Optimization Features
- **Materialized Views**: For heavy aggregations
- **Indexing**: Strategic database indexes
- **Connection Pooling**: PostgreSQL connection management
- **Query Optimization**: Efficient SQL patterns

### Benchmarks
- **Inventory Valuation**: <200ms (cached), <500ms (uncached)
- **Turnover Analysis**: <300ms (cached), <800ms (uncached)
- **Chart Data Generation**: <100ms (cached)
- **Authentication**: <50ms

## Security

### Implemented Measures
- **JWT Authentication**: Secure token-based auth
- **Role-Based Access Control**: Granular permissions
- **Rate Limiting**: API abuse prevention
- **Input Validation**: SQL injection prevention
- **CORS Configuration**: Cross-origin security

### Security Headers
- Helmet.js for security headers
- CORS with origin validation
- Rate limiting per IP
- Request size limits

## Monitoring

### Health Checks
- `GET /health` - Service health status
- Database connectivity
- Redis connectivity
- Scheduler status

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
### Logging
- Structured JSON logging
- Error tracking
- Performance metrics
- Request/response logging

## Deployment

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key

# Server
API_PORT=3000
FRONTEND_URL=http://localhost:3000

# Node Environment
NODE_ENV=production
```

### Docker Support
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
# Build application

FROM node:18-alpine AS runtime
# Runtime configuration
```

### Kubernetes
- Health checks configured
- Graceful shutdown handling
- Horizontal pod scaling support
- Environment-based configuration

## Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Run tests: `npm test`
4. Ensure code coverage: `npm run test:coverage`
5. Submit pull request

### Code Style
- ESLint configuration
- Prettier formatting
- TypeScript strict mode
- Conventional commits

## License

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `API_PORT` - Port to run the API on (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `JWT_ACCESS_SECRET` - Secret used to sign JWT access tokens (required in production)
- `JWT_REFRESH_SECRET` - Secret used to sign JWT refresh tokens (required in production)
- `JWT_ACCESS_EXPIRES_IN` - Access token lifetime (e.g. `15m`)
- `JWT_REFRESH_EXPIRES_IN` - Refresh token lifetime (e.g. `7d`)

## Authentication & Authorization

The API now provides a fully in-memory authentication module with password hashing, JWT access/refresh tokens, and role-based access control (admin, manager, staff).

Available endpoints:

- `POST /auth/register` – Bootstrap the first administrator or create additional users when authenticated as an admin
- `POST /auth/login` – Validate credentials and receive an access/refresh token pair
- `POST /auth/refresh` – Rotate the token pair using a valid refresh token
- `POST /auth/logout` – Revoke the provided refresh token (requires authentication)
- `GET /auth/me` – Return the authenticated user profile
- `GET /secure/reports/daily` – Example RBAC-protected route available to managers and administrators
- `GET /secure/admin/audit-log` – Example RBAC-protected route limited to administrators

Interactive API documentation with updated security schemes is available at `/docs` when the server is running.

See [`docs/authentication.md`](../../docs/authentication.md) for a detailed explanation of the token lifecycle, rotation strategy, and production configuration guidelines.
This project is licensed under the MIT License - see the LICENSE file for details.
