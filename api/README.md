# Barber Booking API

A Node.js/Express API service with integrated WhatsApp notifications via Twilio.

## Features

- **RESTful API**: Booking management endpoints
- **WhatsApp Notifications**: Automatic barber notifications via Twilio
- **Message Templates**: Configurable message templates
- **Notification Logging**: Complete audit trail of all notifications
- **Retry Logic**: Automatic retry with exponential backoff
- **Database Integration**: PostgreSQL for data persistence
- **Comprehensive Testing**: 84% test coverage with Jest

## Quick Start

### Prerequisites

- Node.js >= 16
- PostgreSQL database
- Twilio account (for WhatsApp notifications)

### Installation

```bash
npm install
```

### Configuration

1. Copy `.env.example` to `.env`:
```bash
cp ../.env.example .env
```

2. Configure environment variables:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Twilio WhatsApp
WHATSAPP_ENABLED=true
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Optional
WHATSAPP_MAX_RETRIES=3
WHATSAPP_RETRY_DELAY=5000
LOG_LEVEL=INFO
```

### Database Setup

Run migrations to create required tables:

```bash
npm run migrate
```

This creates:
- `notification_log` table for tracking WhatsApp message attempts

### Start Server

```bash
# Development
npm run dev

# Production
npm start
```

Server runs on port 3001 by default (configurable via `PORT` env var).

## API Endpoints

### Health Check

```http
GET /health
```

Returns service health status.

### Create Booking

```http
POST /api/bookings
Content-Type: application/json

{
  "customerName": "John Doe",
  "customerPhone": "+1234567890",
  "barberPhone": "+9876543210",
  "barberName": "Jane Smith",
  "appointmentTime": "2024-01-15 10:00 AM"
}
```

Creates a booking and sends WhatsApp notification to barber.

**Required fields**: `customerName`, `customerPhone`, `appointmentTime`

**Response**:
```json
{
  "booking": {
    "id": 123,
    "customerName": "John Doe",
    "status": "confirmed",
    "createdAt": "2024-01-15T08:00:00.000Z"
  },
  "notification": {
    "sent": true,
    "notificationLogId": 1,
    "messageSid": "SM123..."
  }
}
```

### Get Notification Logs

```http
GET /api/notifications?bookingId=123
```

Retrieves all notification attempts for a booking.

```http
GET /api/notifications/:id
```

Retrieves a specific notification by ID.

## Project Structure

```
api/
├── src/
│   ├── config/
│   │   ├── database.js       # Database connection
│   │   └── whatsapp.js       # WhatsApp configuration
│   ├── models/
│   │   └── NotificationLog.js # Notification log model
│   ├── routes/
│   │   ├── bookings.js       # Booking endpoints
│   │   └── notifications.js  # Notification endpoints
│   ├── services/
│   │   ├── whatsappService.js # WhatsApp service
│   │   └── __mocks__/        # Test mocks
│   ├── utils/
│   │   ├── logger.js         # Logging utility
│   │   └── messageTemplates.js # Message templates
│   └── __tests__/            # Test files
├── migrations/
│   └── 001_create_notification_log.sql
├── scripts/
│   └── migrate.js            # Migration runner
├── server.js                 # Main server file
├── package.json
└── README.md                 # This file
```

## WhatsApp Service

The WhatsApp service provides notification capabilities using Twilio's API.

### Key Features

- **Template-based messages**: Pre-configured templates for different notification types
- **Automatic retry**: Up to 3 retries with exponential backoff
- **Database logging**: All attempts logged with status and errors
- **Error handling**: Comprehensive error handling and logging

### Available Templates

1. **booking_confirmation** - Sent to barber on new booking
2. **booking_reminder** - Appointment reminder
3. **booking_cancellation** - Cancellation notification

### Usage Example

```javascript
const WhatsAppService = require('./src/services/whatsappService');

const service = new WhatsAppService();

await service.sendBookingNotification({
  bookingId: 123,
  customerName: 'John Doe',
  customerPhone: '+1234567890',
  barberPhone: '+9876543210',
  barberName: 'Jane Smith',
  appointmentTime: '2024-01-15 10:00 AM',
});
```

For detailed documentation, see:
- [WhatsApp Service Documentation](./WHATSAPP_SERVICE.md)
- [Example Usage](./EXAMPLE_USAGE.md)
- [Implementation Summary](./WHATSAPP_IMPLEMENTATION_SUMMARY.md)

## Testing

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm test -- --watch
```

Run tests with coverage:

```bash
npm test -- --coverage
```

### Test Coverage

```
Test Suites: 6 passed, 6 total
Tests:       31 passed, 31 total
Coverage:    84% overall
```

### Test Files

- `src/__tests__/whatsappService.test.js` - WhatsApp service tests
- `src/__tests__/messageTemplates.test.js` - Template tests
- `src/__tests__/bookings.test.js` - Booking API tests
- `src/__tests__/notificationLog.test.js` - Database model tests
- `src/__tests__/integration.test.js` - Integration tests

## Development

### Adding a New Message Template

1. Edit `src/utils/messageTemplates.js`:

```javascript
const templates = {
  // Existing templates...
  
  my_custom_template: {
    name: 'my_custom_template',
    generate: ({ param1, param2 }) => {
      return `Custom message with ${param1} and ${param2}`;
    },
  },
};
```

2. Use the template:

```javascript
await whatsappService.sendTemplatedMessage(
  '+1234567890',
  'my_custom_template',
  { param1: 'value1', param2: 'value2' }
);
```

### Database Migrations

To add a new migration:

1. Create a new `.sql` file in `migrations/` with format `XXX_description.sql`
2. Run `npm run migrate` to apply

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3001 | No |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `WHATSAPP_ENABLED` | Enable WhatsApp service | false | No |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | - | Yes* |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | - | Yes* |
| `TWILIO_WHATSAPP_NUMBER` | WhatsApp sender number | whatsapp:+14155238886 | No |
| `WHATSAPP_MAX_RETRIES` | Max retry attempts | 3 | No |
| `WHATSAPP_RETRY_DELAY` | Retry delay (ms) | 5000 | No |
| `WHATSAPP_TIMEOUT` | Request timeout (ms) | 30000 | No |
| `LOG_LEVEL` | Logging level | INFO | No |

*Required when `WHATSAPP_ENABLED=true`

## Deployment

### Docker

Build the image:

```bash
docker build -t barber-api .
```

Run the container:

```bash
docker run -p 3001:3001 \
  -e DATABASE_URL=postgresql://... \
  -e WHATSAPP_ENABLED=true \
  -e TWILIO_ACCOUNT_SID=... \
  -e TWILIO_AUTH_TOKEN=... \
  barber-api
```

### Docker Compose

See `../docker-compose.yml` for full stack deployment.

## Monitoring

### Logging

The API uses structured logging with the following levels:

- **ERROR**: Critical errors requiring attention
- **WARN**: Warning conditions
- **INFO**: Informational messages (default)
- **DEBUG**: Detailed debug information

Set `LOG_LEVEL` environment variable to control verbosity.

### Health Check

Monitor the health endpoint:

```bash
curl http://localhost:3001/health
```

### Notification Monitoring

Query notification logs to monitor success rate:

```sql
SELECT 
  status,
  COUNT(*) as count,
  AVG(retry_count) as avg_retries
FROM notification_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

## Troubleshooting

### Database Connection Issues

**Error**: `Connection refused`

**Solution**: Verify DATABASE_URL and ensure PostgreSQL is running.

### WhatsApp Messages Not Sending

**Error**: `Authentication failed`

**Solutions**:
1. Verify TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN
2. Check Twilio account status
3. Ensure WHATSAPP_ENABLED=true

**Error**: `Permission denied (21408)`

**Solutions**:
1. For sandbox: Recipient must join sandbox
2. For production: Use approved templates

### High Retry Counts

Check notification logs for error patterns:

```sql
SELECT error_message, COUNT(*) 
FROM notification_log 
WHERE status = 'failed' 
GROUP BY error_message;
```

## Support

- [Twilio Documentation](https://www.twilio.com/docs/whatsapp)
- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## License

[Add your license here]
