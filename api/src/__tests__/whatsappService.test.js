const WhatsAppService = require('../services/whatsappService');
const NotificationLog = require('../models/NotificationLog');
const { generateMessage } = require('../utils/messageTemplates');

jest.mock('../models/NotificationLog');
jest.mock('../config/whatsapp', () => ({
  config: {
    enabled: true,
    accountSid: 'test_account_sid',
    authToken: 'test_auth_token',
    whatsappNumber: 'whatsapp:+14155238886',
    maxRetries: 3,
    retryDelay: 100,
    timeout: 30000,
  },
  validateConfig: jest.fn(),
}));

describe('WhatsAppService', () => {
  let whatsappService;
  let mockTwilioClient;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTwilioClient = {
      messages: {
        create: jest.fn(),
      },
    };

    whatsappService = new WhatsAppService(mockTwilioClient);
    whatsappService.config.enabled = true;
  });

  describe('sendMessage', () => {
    it('should send a WhatsApp message successfully', async () => {
      const mockResponse = {
        sid: 'SM123456789',
        status: 'queued',
      };

      mockTwilioClient.messages.create.mockResolvedValue(mockResponse);

      const result = await whatsappService.sendMessage(
        '+1234567890',
        'Test message',
        123
      );

      expect(result.success).toBe(true);
      expect(result.messageSid).toBe('SM123456789');
      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: 'Test message',
        from: 'whatsapp:+14155238886',
        to: 'whatsapp:+1234567890',
      });
    });

    it('should handle send failure', async () => {
      const mockError = new Error('Network error');
      mockError.code = 21408;

      mockTwilioClient.messages.create.mockRejectedValue(mockError);

      const result = await whatsappService.sendMessage(
        '+1234567890',
        'Test message'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.code).toBe(21408);
    });

    it('should format phone number with whatsapp prefix', async () => {
      const mockResponse = {
        sid: 'SM123456789',
        status: 'queued',
      };

      mockTwilioClient.messages.create.mockResolvedValue(mockResponse);

      await whatsappService.sendMessage('+1234567890', 'Test message');

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'whatsapp:+1234567890',
        })
      );
    });

    it('should not send message when service is disabled', async () => {
      const disabledService = new WhatsAppService(mockTwilioClient);
      disabledService.config.enabled = false;

      const result = await disabledService.sendMessage(
        '+1234567890',
        'Test message'
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe('service_disabled');
      expect(mockTwilioClient.messages.create).not.toHaveBeenCalled();
    });
  });

  describe('sendTemplatedMessage', () => {
    it('should send a templated message successfully', async () => {
      const mockResponse = {
        sid: 'SM123456789',
        status: 'queued',
      };

      mockTwilioClient.messages.create.mockResolvedValue(mockResponse);

      const templateData = {
        customerName: 'John Doe',
        phone: '+1234567890',
        appointmentTime: '2024-01-15 10:00 AM',
        barberName: 'Jane Smith',
      };

      const result = await whatsappService.sendTemplatedMessage(
        '+1234567890',
        'booking_confirmation',
        templateData,
        123
      );

      expect(result.success).toBe(true);
      expect(mockTwilioClient.messages.create).toHaveBeenCalled();
      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0];
      expect(callArgs.body).toContain('John Doe');
      expect(callArgs.body).toContain('+1234567890');
      expect(callArgs.body).toContain('2024-01-15 10:00 AM');
    });

    it('should handle invalid template name', async () => {
      const result = await whatsappService.sendTemplatedMessage(
        '+1234567890',
        'invalid_template',
        {},
        123
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      expect(mockTwilioClient.messages.create).not.toHaveBeenCalled();
    });
  });

  describe('sendBookingNotification', () => {
    beforeEach(() => {
      NotificationLog.create.mockResolvedValue({
        id: 1,
        booking_id: 123,
        status: 'pending',
      });

      NotificationLog.updateStatus.mockResolvedValue({
        id: 1,
        status: 'sent',
      });
    });

    it('should send booking notification successfully', async () => {
      const mockResponse = {
        sid: 'SM123456789',
        status: 'queued',
      };

      mockTwilioClient.messages.create.mockResolvedValue(mockResponse);

      const bookingData = {
        bookingId: 123,
        customerName: 'John Doe',
        customerPhone: '+1234567890',
        barberPhone: '+9876543210',
        barberName: 'Jane Smith',
        appointmentTime: '2024-01-15 10:00 AM',
      };

      const result = await whatsappService.sendBookingNotification(bookingData);

      expect(result.success).toBe(true);
      expect(result.notificationLogId).toBe(1);
      expect(NotificationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingId: 123,
          recipientPhone: '+9876543210',
          messageType: 'booking_confirmation',
        })
      );
      expect(NotificationLog.updateStatus).toHaveBeenCalledWith(
        1,
        'sent',
        expect.objectContaining({
          providerMessageId: 'SM123456789',
        })
      );
    });

    it('should return early if no barber phone provided', async () => {
      const bookingData = {
        bookingId: 123,
        customerName: 'John Doe',
        customerPhone: '+1234567890',
        barberPhone: null,
        appointmentTime: '2024-01-15 10:00 AM',
      };

      const result = await whatsappService.sendBookingNotification(bookingData);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('no_recipient');
      expect(NotificationLog.create).not.toHaveBeenCalled();
    });
  });

  describe('sendWithRetry', () => {
    beforeEach(() => {
      NotificationLog.updateStatus.mockResolvedValue({ id: 1 });
      NotificationLog.incrementRetryCount.mockResolvedValue({ id: 1 });
    });

    it('should succeed on first attempt', async () => {
      const mockResponse = {
        sid: 'SM123456789',
        status: 'queued',
      };

      mockTwilioClient.messages.create.mockResolvedValue(mockResponse);

      const result = await whatsappService.sendWithRetry(
        '+1234567890',
        'Test message',
        1,
        123
      );

      expect(result.success).toBe(true);
      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(1);
      expect(NotificationLog.updateStatus).toHaveBeenCalledWith(
        1,
        'sent',
        expect.any(Object)
      );
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockResponse = {
        sid: 'SM123456789',
        status: 'queued',
      };

      mockTwilioClient.messages.create
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce(mockResponse);

      const result = await whatsappService.sendWithRetry(
        '+1234567890',
        'Test message',
        1,
        123
      );

      expect(result.success).toBe(true);
      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(2);
      expect(NotificationLog.incrementRetryCount).toHaveBeenCalledTimes(1);
    });

    it('should fail after max retries', async () => {
      mockTwilioClient.messages.create.mockRejectedValue(
        new Error('Persistent error')
      );

      const result = await whatsappService.sendWithRetry(
        '+1234567890',
        'Test message',
        1,
        123
      );

      expect(result.success).toBe(false);
      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(3);
      expect(NotificationLog.updateStatus).toHaveBeenCalledWith(
        1,
        'failed',
        expect.objectContaining({
          errorMessage: 'Persistent error',
        })
      );
    });
  });
});
