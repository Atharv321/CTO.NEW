const mockSendMessage = jest.fn();
const mockSendTemplatedMessage = jest.fn();
const mockSendBookingNotification = jest.fn();
const mockSendWithRetry = jest.fn();

class WhatsAppService {
  constructor(twilioClient = null) {
    this.client = twilioClient;
    this.config = {
      enabled: true,
      accountSid: 'test_sid',
      authToken: 'test_token',
      whatsappNumber: 'whatsapp:+14155238886',
      maxRetries: 3,
      retryDelay: 100,
      timeout: 30000,
    };
  }

  async sendMessage(to, message, bookingId = null) {
    return mockSendMessage(to, message, bookingId);
  }

  async sendTemplatedMessage(to, templateName, templateData, bookingId = null) {
    return mockSendTemplatedMessage(to, templateName, templateData, bookingId);
  }

  async sendBookingNotification(bookingData) {
    return mockSendBookingNotification(bookingData);
  }

  async sendWithRetry(to, message, notificationLogId, bookingId = null, attempt = 1) {
    return mockSendWithRetry(to, message, notificationLogId, bookingId, attempt);
  }
}

WhatsAppService.mockSendMessage = mockSendMessage;
WhatsAppService.mockSendTemplatedMessage = mockSendTemplatedMessage;
WhatsAppService.mockSendBookingNotification = mockSendBookingNotification;
WhatsAppService.mockSendWithRetry = mockSendWithRetry;

module.exports = WhatsAppService;
