# Alerting Service

A comprehensive notification system that processes various business events and delivers notifications through multiple channels.

## Features

- **Multi-channel notifications**: Email (SendGrid), SMS, Push, In-app
- **Event-driven architecture**: Consumes low-stock, expiration, and order update events  
- **User preferences**: Configurable notification channels, quiet hours, and priority thresholds
- **Background processing**: Worker-based queue processing for reliable delivery
- **Threshold-based alerts**: Configurable thresholds for stock levels and expiration dates
- **Extensible design**: Easy to add new notification channels and event types

## Architecture

### Core Components

1. **NotificationService**: Central service for processing events and managing notifications
2. **NotificationWorker**: Background worker that processes the notification queue
3. **Notification Adapters**: Pluggable adapters for different notification channels
4. **API Endpoints**: RESTful API for managing preferences and retrieving notifications

### Event Types

- `low_stock`: Triggered when inventory items fall below threshold levels
- `impending_expiration`: Triggered when items are approaching expiration
- `supplier_order_update`: Triggered when supplier orders change status

### Notification Channels

- **Email**: SendGrid integration (mock adapter available for testing)
- **SMS**: Mock adapter (ready for real provider integration)
- **Push**: Mock adapter (ready for real provider integration)  
- **In-app**: Built-in storage for app notifications

## API Endpoints

### Notifications

#### Get User Notifications
```
GET /api/alerts/notifications/:userId
```

#### Mark Notification as Read
```
PUT /api/alerts/notifications/:userId/:notificationId/read
```

### User Preferences

#### Set User Preferences
```
POST /api/alerts/preferences/:userId
Content-Type: application/json

{
  "channels": [
    { "type": "email", "enabled": true },
    { "type": "sms", "enabled": false },
    { "type": "push", "enabled": true },
    { "type": "in_app", "enabled": true }
  ],
  "eventTypes": ["low_stock", "impending_expiration"],
  "minPriority": "medium",
  "quietHours": {
    "start": "22:00",
    "end": "06:00"
  }
}
```

#### Get User Preferences
```
GET /api/alerts/preferences/:userId
```

### Events

#### Trigger Notification Event
```
POST /api/alerts/events
Content-Type: application/json

{
  "type": "low_stock",
  "userId": "user123",
  "data": {
    "itemName": "Product Name",
    "currentStock": 5
  },
  "priority": "high"
}
```

## Configuration

### Environment Variables

```bash
# SendGrid Configuration
SENDGRID_API_KEY=your-sendgrid-api-key-here
FROM_EMAIL=noreply@yourcompany.com

# API Configuration  
API_PORT=3000

# Optional: Database for persistence
DATABASE_URL=postgresql://user:password@localhost:5432/notifications

# Optional: Redis for queue management
REDIS_URL=redis://localhost:6379
```

## Usage Examples

### Setting up User Preferences

```javascript
const preferences = {
  userId: 'user123',
  channels: [
    { type: 'email', enabled: true },
    { type: 'sms', enabled: false },
    { type: 'push', enabled: true },
    { type: 'in_app', enabled: true }
  ],
  eventTypes: ['low_stock', 'impending_expiration'],
  minPriority: 'medium',
  quietHours: {
    start: '22:00',
    end: '06:00'
  }
};

// POST to /api/alerts/preferences/user123
await fetch('/api/alerts/preferences/user123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(preferences)
});
```

### Triggering a Low Stock Alert

```javascript
const lowStockEvent = {
  type: 'low_stock',
  userId: 'user123',
  data: {
    itemName: 'Wireless Mouse',
    currentStock: 3,
    reorderLevel: 10
  },
  priority: 'high'
};

// POST to /api/alerts/events
await fetch('/api/alerts/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(lowStockEvent)
});
```

### Retrieving In-App Notifications

```javascript
// GET /api/alerts/notifications/user123
const response = await fetch('/api/alerts/notifications/user123');
const { data: notifications } = await response.json();

console.log(notifications);
// [
//   {
//     id: 'msg_123456',
//     userId: 'user123',
//     title: 'Low Stock Alert: Wireless Mouse',
//     message: 'Item "Wireless Mouse" is running low with only 3 units remaining.',
//     read: false,
//     createdAt: '2024-12-15T10:30:00Z'
//   }
// ]
```

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Test Coverage
```bash
npm run test:coverage
```

## Development

### Running the API
```bash
cd apps/api
npm run dev
```

### Building
```bash
cd apps/api
npm run build
```

## Extending the System

### Adding a New Notification Channel

1. Create a new adapter implementing the `NotificationAdapter` interface:

```javascript
export class CustomAdapter implements NotificationAdapter {
  async send(message: NotificationMessage): Promise<boolean> {
    // Implementation here
    return true;
  }
}
```

2. Register the adapter in the worker:

```javascript
worker.getNotificationService().registerAdapter('custom', new CustomAdapter());
```

### Adding a New Event Type

1. Add the new type to the `NotificationEvent['type']` union
2. Update message generation in `NotificationService.generateMessageContent()`
3. Add corresponding tests

## Production Considerations

- **Persistence**: Currently uses in-memory storage. Consider adding database persistence for production
- **Queue Management**: Redis or similar for reliable queue processing
- **Retry Logic**: Implement exponential backoff for failed notifications
- **Rate Limiting**: Add rate limiting to prevent notification spam
- **Monitoring**: Add metrics and logging for observability

## License

MIT License - see LICENSE file for details