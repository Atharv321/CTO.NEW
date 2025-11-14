# WhatsApp Notification Service

## Overview

This service provides WhatsApp messaging capabilities using Twilio's API to send booking notifications to barbers. It includes comprehensive error handling, retry logic, and notification logging.

## Features

- **Twilio Integration**: Send WhatsApp messages via Twilio API
- **Message Templates**: Pre-configured templates for different notification types
- **Retry Logic**: Automatic retry with exponential backoff on failures
- **Notification Logging**: Store all message attempts with status and error details
- **Configurable**: Environment variable-based configuration
- **Test Mocks**: Comprehensive mocking for unit tests

## Architecture

```
┌─────────────────┐
│   Booking API   │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ WhatsApp Service│
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    v         v
┌────────┐  ┌──────────────┐
│ Twilio │  │ Notification │
│  API   │  │     Log      │
└────────┘  └──────────────┘
```

## Installation

The service is already integrated into the API. Required dependencies:

```bash
npm install twilio dotenv
```

## Configuration

Add the following environment variables to your `.env` file:

```env
# WhatsApp/Twilio Configuration
WHATSAPP_ENABLED=true
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
WHATSAPP_MAX_RETRIES=3
WHATSAPP_RETRY_DELAY=5000
WHATSAPP_TIMEOUT=30000

# Logging
LOG_LEVEL=INFO
```

### Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `WHATSAPP_ENABLED` | Enable/disable the service | `false` |
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID | Required |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token | Required |
| `TWILIO_WHATSAPP_NUMBER` | Twilio WhatsApp number | `whatsapp:+14155238886` |
| `WHATSAPP_MAX_RETRIES` | Max retry attempts | `3` |
| `WHATSAPP_RETRY_DELAY` | Delay between retries (ms) | `5000` |
| `WHATSAPP_TIMEOUT` | Request timeout (ms) | `30000` |
| `LOG_LEVEL` | Logging level | `INFO` |

## Database Schema

The service uses a `notification_log` table to track all message attempts:

```sql
CREATE TABLE notification_log (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  recipient_name VARCHAR(255) NOT NULL,
  message_type VARCHAR(50) NOT NULL DEFAULT 'booking_confirmation',
  message_template VARCHAR(100),
  message_content TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  provider VARCHAR(50) NOT NULL DEFAULT 'twilio',
  provider_message_id VARCHAR(255),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP
);
```

### Status Values

- `pending`: Message queued for sending
- `sent`: Message successfully sent
- `failed`: Message failed after all retries

## Usage

### Basic Usage

```javascript
const WhatsAppService = require('./services/whatsappService');

const whatsappService = new WhatsAppService();

// Send a simple message
const result = await whatsappService.sendMessage(
  '+1234567890',
  'Hello from your barber shop!'
);
```

### Sending Booking Notifications

```javascript
const bookingData = {
  bookingId: 123,
  customerName: 'John Doe',
  customerPhone: '+1234567890',
  barberPhone: '+9876543210',
  barberName: 'Jane Smith',
  appointmentTime: '2024-01-15 10:00 AM',
};

const result = await whatsappService.sendBookingNotification(bookingData);

if (result.success) {
  console.log('Notification sent:', result.messageSid);
} else {
  console.error('Failed to send notification:', result.error);
}
```

### Using Message Templates

```javascript
const { generateMessage } = require('./utils/messageTemplates');

const message = generateMessage('booking_confirmation', {
  customerName: 'John Doe',
  phone: '+1234567890',
  appointmentTime: '2024-01-15 10:00 AM',
  barberName: 'Jane Smith',
});

await whatsappService.sendMessage('+9876543210', message);
```

## Available Templates

### booking_confirmation

Sent to barber when a new booking is created.

**Required Data:**
- `customerName`: Customer's full name
- `phone`: Customer's phone number
- `appointmentTime`: Appointment date and time
- `barberName`: (Optional) Barber's name

**Example:**
```
🔔 New Booking Alert!

Customer: John Doe
Phone: +1234567890
Appointment: 2024-01-15 10:00 AM
Barber: Jane Smith

Please confirm this booking.
```

### booking_reminder

Reminder sent before an appointment.

**Required Data:**
- `customerName`: Customer's full name
- `appointmentTime`: Appointment date and time

### booking_cancellation

Notification when a booking is cancelled.

**Required Data:**
- `customerName`: Customer's full name
- `appointmentTime`: Appointment date and time

## API Endpoints

### Create Booking with Notification

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

**Response:**
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
    "messageSid": "SM123456789"
  }
}
```

### Get Notification Logs

```http
GET /api/notifications?bookingId=123
```

**Response:**
```json
{
  "notifications": [
    {
      "id": 1,
      "booking_id": 123,
      "recipient_phone": "+9876543210",
      "status": "sent",
      "provider_message_id": "SM123456789",
      "created_at": "2024-01-15T08:00:00.000Z",
      "sent_at": "2024-01-15T08:00:05.000Z"
    }
  ]
}
```

## Error Handling

The service implements comprehensive error handling:

1. **Configuration Errors**: Validates required environment variables on initialization
2. **Network Errors**: Catches and logs Twilio API errors
3. **Retry Logic**: Automatically retries failed messages with exponential backoff
4. **Error Logging**: All errors are logged to NotificationLog table

### Error Codes

Common Twilio error codes:

- `21408`: Permission denied (number not verified)
- `21211`: Invalid phone number
- `21614`: Unable to create record
- `30007`: Message blocked by carrier

## Testing

The service includes comprehensive test coverage with mocked Twilio client.

### Running Tests

```bash
npm test
```

### Test Coverage

- WhatsApp Service (100%)
  - Send message
  - Send templated message
  - Booking notifications
  - Retry logic
- Message Templates (100%)
- Booking API (100%)
- NotificationLog Model (100%)

### Mock Usage

```javascript
const WhatsAppService = require('./services/whatsappService');

// Mock Twilio client
const mockTwilioClient = {
  messages: {
    create: jest.fn().mockResolvedValue({
      sid: 'SM123456789',
      status: 'queued',
    }),
  },
};

const whatsappService = new WhatsAppService(mockTwilioClient);

// Use in tests
await whatsappService.sendMessage('+1234567890', 'Test');
expect(mockTwilioClient.messages.create).toHaveBeenCalled();
```

## Monitoring and Logging

The service uses a structured logger that outputs to console:

```
[2024-01-15T08:00:00.000Z] [INFO] Sending WhatsApp message {"to":"whatsapp:+1234567890","bookingId":123}
[2024-01-15T08:00:05.000Z] [INFO] WhatsApp message sent successfully {"messageSid":"SM123456789"}
```

### Log Levels

- `ERROR`: Critical errors that require attention
- `WARN`: Warning messages (e.g., no recipient)
- `INFO`: Normal operational messages
- `DEBUG`: Detailed debugging information

## Retry Strategy

The service implements exponential backoff for retries:

1. **First Attempt**: Immediate send
2. **First Retry**: Wait 5 seconds (configurable)
3. **Second Retry**: Wait 10 seconds (2x delay)
4. **Third Retry**: Wait 15 seconds (3x delay)

After max retries, the notification is marked as `failed` in the database.

## Production Considerations

1. **Rate Limiting**: Twilio has rate limits - consider implementing queue-based sending for high volume
2. **Phone Number Format**: Always use E.164 format (+[country code][number])
3. **WhatsApp Business API**: Consider upgrading to WhatsApp Business API for custom templates
4. **Monitoring**: Set up alerts for failed notifications
5. **Data Retention**: Implement cleanup for old notification logs
6. **Security**: Store Twilio credentials securely (use secrets manager in production)

## Troubleshooting

### Service Disabled

**Issue**: Messages not being sent
**Solution**: Set `WHATSAPP_ENABLED=true` in environment variables

### Invalid Credentials

**Issue**: `Authentication failed` error
**Solution**: Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are correct

### Phone Number Not Verified

**Issue**: Error code 21408
**Solution**: In Twilio sandbox, add recipient to allowed numbers

### Message Not Received

**Issue**: Message shows as sent but not received
**Solution**: Check recipient has WhatsApp installed and number is correct

## Future Enhancements

- [ ] Support for message attachments (images, PDFs)
- [ ] Rich message templates with buttons
- [ ] Delivery status webhooks
- [ ] Message scheduling
- [ ] Bulk messaging support
- [ ] Multi-language templates
- [ ] Message analytics dashboard

## Support

For issues or questions:

1. Check Twilio dashboard for API status
2. Review notification logs in database
3. Check application logs for error messages
4. Verify environment variables are set correctly

## References

- [Twilio WhatsApp API Documentation](https://www.twilio.com/docs/whatsapp)
- [Twilio Node.js SDK](https://www.twilio.com/docs/libraries/node)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
