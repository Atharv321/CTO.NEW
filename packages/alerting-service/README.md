# Barber Booking Alerting Service

A comprehensive notification service for the barber booking system that handles alerts for low stock events, impending expirations, and supplier order updates.

## Features

- **Multi-channel Notifications**: Email (SendGrid), SMS, Push, and In-App notifications
- **Background Worker**: Queue-based processing with Bull and Redis
- **User Preferences**: Configurable notification preferences per user
- **Threshold-based Alerts**: Configurable thresholds for different event types
- **Extensible Architecture**: Easy to add new notification channels
- **Comprehensive Testing**: Unit and integration tests

## Event Types

### LOW_STOCK
Triggered when product inventory falls below configured thresholds:
- Critical: stock < 5 (Email, SMS, In-App)
- High: stock < 10 (Email, In-App)  
- Medium: stock < 20 (In-App)

### IMMINENT_EXPIRATION
Triggered when products are approaching expiration:
- Critical: daysUntilExpiration ≤ 1 (Email, SMS, In-App)
- High: daysUntilExpiration ≤ 3 (Email, In-App)
- Medium: daysUntilExpiration ≤ 7 (In-App)

### SUPPLIER_ORDER_UPDATE
Triggered by supplier order status changes:
- High: status = "DELAYED" (Email, In-App)
- Low: status = "SHIPPED" (In-App)

## API Endpoints

### Health
- `GET /health` - Service health check

### Alerts
- `POST /api/v1/alerts` - Create new alert event
- `GET /api/v1/alerts/:eventId` - Get alert by ID
- `GET /api/v1/alerts/user/:userId` - Get alerts for user
- `GET /api/v1/alerts/type/:type` - Get alerts by type
- `GET /api/v1/alerts/stats/queue` - Queue statistics

### Notifications
- `GET /api/v1/notifications/preferences/:userId` - Get user preferences
- `PUT /api/v1/notifications/preferences/:userId` - Update user preferences
- `GET /api/v1/notifications/in-app/:userId` - Get in-app notifications
- `DELETE /api/v1/notifications/in-app/:userId` - Clear in-app notifications
- `POST /api/v1/notifications/test` - Send test notification

## Configuration

Environment variables (see `.env.example`):

```bash
PORT=3001
REDIS_HOST=localhost
REDIS_PORT=6379
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM_EMAIL=noreply@barberbooking.com
```

## Development

### Installation
```bash
pnpm install
```

### Development Mode
```bash
pnpm dev
```

### Build
```bash
pnpm build
```

### Testing
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test -- --coverage
```

### Type Checking
```bash
pnpm type-check
```

### Linting
```bash
pnpm lint
pnpm lint:fix
```

## Architecture

### Core Components

1. **AlertProcessor**: Evaluates events against thresholds and determines if alerts should be generated
2. **NotificationService**: Manages notification channels and user preferences
3. **QueueService**: Handles background job processing with Bull queues
4. **AlertWorker**: Background worker that processes events and sends notifications
5. **Channel Adapters**: Extensible adapters for different notification channels

### Queue System

Two main queues:
- **Event Queue**: Processes alert events and determines if notifications should be sent
- **Notification Queue**: Sends notifications through appropriate channels

### Notification Channels

- **Email**: SendGrid integration (mock adapter for testing)
- **SMS**: Mock adapter (ready for real SMS provider)
- **Push**: Mock adapter (ready for real push service)
- **In-App**: Memory-based storage (ready for database persistence)

## Testing

The service includes comprehensive tests:

### Unit Tests
- AlertProcessor threshold evaluation
- NotificationService channel management
- Channel adapter functionality

### Integration Tests
- Full API endpoint testing
- Worker queue processing
- End-to-end alert flow

### Test Coverage
- Event processing and threshold evaluation
- Notification delivery across all channels
- User preference management
- Queue statistics and error handling
- API request/response validation

## Usage Examples

### Create an Alert
```bash
curl -X POST http://localhost:3001/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "type": "LOW_STOCK",
    "userId": "user1",
    "data": {
      "productName": "Shampoo",
      "stock": 3
    },
    "severity": "HIGH"
  }'
```

### Get User Preferences
```bash
curl http://localhost:3001/api/v1/notifications/preferences/user1
```

### Update User Preferences
```bash
curl -X PUT http://localhost:3001/api/v1/notifications/preferences/user1 \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@example.com",
    "phoneNumber": "+1234567890",
    "preferences": {
      "LOW_STOCK": ["EMAIL", "IN_APP"],
      "IMMINENT_EXPIRATION": ["EMAIL", "SMS"],
      "SUPPLIER_ORDER_UPDATE": ["EMAIL", "PUSH", "IN_APP"]
    },
    "isEnabled": true
  }'
```

## Production Deployment

1. Set up Redis for queue management
2. Configure SendGrid API credentials
3. Set up proper database persistence for in-app notifications
4. Configure monitoring and logging
5. Set up proper error handling and retry mechanisms
6. Configure horizontal scaling for workers

## Extending the Service

### Adding New Event Types
1. Add to `EventType` enum in `types/index.ts`
2. Add threshold configuration in `AlertProcessor`
3. Add message generation logic in `AlertProcessor.generateAlertMessage`

### Adding New Notification Channels
1. Add to `NotificationChannel` enum in `types/index.ts`
2. Create new adapter implementing `ChannelAdapter` interface
3. Register adapter in `NotificationService.initializeAdapters`

### Adding Real Database Persistence
1. Replace memory-based storage with database models
2. Update `AlertProcessor` and `NotificationService` to use database
3. Add proper connection pooling and error handling