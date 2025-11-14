# WhatsApp Service - Example Usage

## Quick Start

### 1. Configure Environment Variables

Create a `.env` file in the `api/` directory:

```env
# Enable WhatsApp notifications
WHATSAPP_ENABLED=true

# Twilio credentials (get from https://console.twilio.com/)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here

# Twilio WhatsApp number (sandbox or approved number)
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Optional: Retry configuration
WHATSAPP_MAX_RETRIES=3
WHATSAPP_RETRY_DELAY=5000
WHATSAPP_TIMEOUT=30000

# Optional: Logging
LOG_LEVEL=INFO
```

### 2. Run Database Migrations

```bash
npm run migrate
```

This creates the `notification_log` table to track all message attempts.

### 3. Start the Server

```bash
npm start
```

## API Examples

### Create a Booking with Notification

```bash
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerPhone": "+1234567890",
    "barberPhone": "+9876543210",
    "barberName": "Jane Smith",
    "appointmentTime": "2024-01-15 10:00 AM"
  }'
```

**Response:**
```json
{
  "booking": {
    "id": 1763115802305,
    "customerName": "John Doe",
    "customerPhone": "+1234567890",
    "barberPhone": "+9876543210",
    "barberName": "Jane Smith",
    "appointmentTime": "2024-01-15 10:00 AM",
    "status": "confirmed",
    "createdAt": "2024-01-15T08:00:00.000Z"
  },
  "notification": {
    "sent": true,
    "notificationLogId": 1,
    "messageSid": "SM1234567890abcdef1234567890abcdef"
  }
}
```

### Get Notification Logs for a Booking

```bash
curl -X GET "http://localhost:3001/api/notifications?bookingId=1763115802305"
```

**Response:**
```json
{
  "notifications": [
    {
      "id": 1,
      "booking_id": 1763115802305,
      "recipient_phone": "+9876543210",
      "recipient_name": "Jane Smith",
      "message_type": "booking_confirmation",
      "message_template": "booking_confirmation",
      "message_content": "🔔 New Booking Alert!\n\nCustomer: John Doe\nPhone: +1234567890\nAppointment: 2024-01-15 10:00 AM\nBarber: Jane Smith\n\nPlease confirm this booking.",
      "status": "sent",
      "provider": "twilio",
      "provider_message_id": "SM1234567890abcdef1234567890abcdef",
      "error_message": null,
      "retry_count": 0,
      "created_at": "2024-01-15T08:00:00.000Z",
      "updated_at": "2024-01-15T08:00:05.000Z",
      "sent_at": "2024-01-15T08:00:05.000Z"
    }
  ]
}
```

### Get a Specific Notification

```bash
curl -X GET "http://localhost:3001/api/notifications/1"
```

## Programmatic Usage

### Send a Simple Message

```javascript
const WhatsAppService = require('./src/services/whatsappService');

const whatsappService = new WhatsAppService();

async function sendWelcomeMessage() {
  const result = await whatsappService.sendMessage(
    '+1234567890',
    'Welcome to our barber shop! 💈'
  );

  if (result.success) {
    console.log('Message sent:', result.messageSid);
  } else {
    console.error('Failed to send:', result.error);
  }
}

sendWelcomeMessage();
```

### Send a Templated Message

```javascript
const WhatsAppService = require('./src/services/whatsappService');

const whatsappService = new WhatsAppService();

async function sendReminder() {
  const result = await whatsappService.sendTemplatedMessage(
    '+1234567890',
    'booking_reminder',
    {
      customerName: 'John Doe',
      appointmentTime: '2024-01-15 10:00 AM',
    }
  );

  if (result.success) {
    console.log('Reminder sent:', result.messageSid);
  }
}

sendReminder();
```

### Send Booking Notification with Logging

```javascript
const WhatsAppService = require('./src/services/whatsappService');

const whatsappService = new WhatsAppService();

async function notifyBarber() {
  const bookingData = {
    bookingId: 123,
    customerName: 'John Doe',
    customerPhone: '+1234567890',
    barberPhone: '+9876543210',
    barberName: 'Jane Smith',
    appointmentTime: '2024-01-15 10:00 AM',
  };

  // This automatically:
  // 1. Creates a notification log entry
  // 2. Sends the message with retry logic
  // 3. Updates the log with success/failure status
  const result = await whatsappService.sendBookingNotification(bookingData);

  if (result.success) {
    console.log('Notification sent successfully');
    console.log('Notification Log ID:', result.notificationLogId);
    console.log('Twilio Message SID:', result.messageSid);
  } else {
    console.error('Failed to send notification');
    console.error('Error:', result.error);
    console.error('Attempts made:', result.attempts);
  }
}

notifyBarber();
```

### Query Notification Logs Programmatically

```javascript
const NotificationLog = require('./src/models/NotificationLog');

async function checkNotificationStatus(bookingId) {
  // Get all notifications for a booking
  const logs = await NotificationLog.findByBookingId(bookingId);

  console.log(`Found ${logs.length} notification(s) for booking ${bookingId}`);

  logs.forEach(log => {
    console.log(`
      Notification ID: ${log.id}
      Status: ${log.status}
      Recipient: ${log.recipient_phone}
      Sent at: ${log.sent_at || 'Not sent'}
      Retries: ${log.retry_count}
      ${log.error_message ? `Error: ${log.error_message}` : ''}
    `);
  });

  // Check if all notifications succeeded
  const allSent = logs.every(log => log.status === 'sent');
  return allSent;
}

checkNotificationStatus(123);
```

## Custom Message Templates

Add custom templates in `src/utils/messageTemplates.js`:

```javascript
const templates = {
  // Existing templates...
  
  // Add your custom template
  custom_promotion: {
    name: 'custom_promotion',
    generate: ({ customerName, discount, validUntil }) => {
      return `🎉 Special Offer for ${customerName}!\n\nGet ${discount}% off your next haircut!\n\nValid until: ${validUntil}\n\nBook now!`;
    },
  },
};
```

Usage:

```javascript
await whatsappService.sendTemplatedMessage(
  '+1234567890',
  'custom_promotion',
  {
    customerName: 'John',
    discount: 20,
    validUntil: '2024-01-31',
  }
);
```

## Testing

### Run All Tests

```bash
npm test
```

### Test with Mock

```javascript
const WhatsAppService = require('./src/services/whatsappService');

// Create a mock Twilio client
const mockTwilioClient = {
  messages: {
    create: jest.fn().mockResolvedValue({
      sid: 'SM_TEST_123',
      status: 'queued',
    }),
  },
};

// Inject mock client
const whatsappService = new WhatsAppService(mockTwilioClient);

// Test your code
await whatsappService.sendMessage('+1234567890', 'Test message');

// Verify
expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
  body: 'Test message',
  from: 'whatsapp:+14155238886',
  to: 'whatsapp:+1234567890',
});
```

## Twilio Sandbox Setup

For development, use Twilio's WhatsApp sandbox:

1. Go to https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Send a WhatsApp message to the sandbox number with the join code
3. Use the sandbox number in your configuration:
   ```env
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```
4. You can now send messages to any number that has joined the sandbox

## Production Checklist

- [ ] Get Twilio WhatsApp Business account approval
- [ ] Use approved WhatsApp templates
- [ ] Store credentials in secure secrets manager
- [ ] Set up monitoring for failed notifications
- [ ] Configure proper rate limiting
- [ ] Implement notification cleanup/archival
- [ ] Set up Twilio webhooks for delivery status
- [ ] Add opt-out handling for recipients
- [ ] Test with real phone numbers
- [ ] Monitor notification costs

## Troubleshooting

### "Service disabled" in logs

**Solution**: Set `WHATSAPP_ENABLED=true` in your `.env` file

### "Authentication failed" error

**Solution**: Verify your `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are correct

### Error code 21408 (Permission denied)

**Solution**: 
- For sandbox: Make sure recipient has joined the sandbox
- For production: Use approved templates and verified sender

### Messages not being received

**Checklist**:
1. Recipient has WhatsApp installed
2. Phone number is in E.164 format (+[country code][number])
3. For sandbox: Recipient has joined
4. Check notification logs for errors
5. Verify Twilio account has credits

### High retry count

**Possible causes**:
- Network issues
- Twilio service degradation
- Invalid recipient number
- Rate limiting

**Solution**: Check notification logs for specific error messages

## Rate Limits

Twilio WhatsApp API rate limits:

- **Sandbox**: ~1 message per second
- **Production**: Varies by account type
- **Business account**: Higher limits available

Implement queue-based processing for high-volume scenarios.

## Cost Estimation

WhatsApp Business API pricing (approximate):

- **Conversation-based pricing**
- **Business-initiated**: ~$0.005 - $0.02 per conversation
- **User-initiated**: Free for 24 hours

Check current pricing: https://www.twilio.com/whatsapp/pricing

## Support

For issues:

1. Check logs: `npm start` (view console output)
2. Check database: Query `notification_log` table
3. Review Twilio dashboard: https://console.twilio.com/
4. Consult docs: https://www.twilio.com/docs/whatsapp

## Next Steps

1. Set up webhooks for delivery status updates
2. Implement message scheduling
3. Add support for media messages (images, PDFs)
4. Create admin dashboard for notification monitoring
5. Add A/B testing for message templates
