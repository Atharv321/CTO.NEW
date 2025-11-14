const NotificationLog = require('../models/NotificationLog');
const { query } = require('../config/database');

jest.mock('../config/database');

describe('NotificationLog Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new notification log entry', async () => {
      const mockResult = {
        rows: [
          {
            id: 1,
            booking_id: 123,
            recipient_phone: '+1234567890',
            recipient_name: 'Jane Smith',
            message_type: 'booking_confirmation',
            message_template: 'booking_confirmation',
            message_content: 'Test message',
            status: 'pending',
            provider: 'twilio',
          },
        ],
      };

      query.mockResolvedValue(mockResult);

      const data = {
        bookingId: 123,
        recipientPhone: '+1234567890',
        recipientName: 'Jane Smith',
        messageType: 'booking_confirmation',
        messageTemplate: 'booking_confirmation',
        messageContent: 'Test message',
        status: 'pending',
        provider: 'twilio',
      };

      const result = await NotificationLog.create(data);

      expect(result).toEqual(mockResult.rows[0]);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notification_log'),
        expect.arrayContaining([123, '+1234567890', 'Jane Smith'])
      );
    });
  });

  describe('updateStatus', () => {
    it('should update notification status to sent', async () => {
      const mockResult = {
        rows: [
          {
            id: 1,
            status: 'sent',
            provider_message_id: 'SM123456789',
          },
        ],
      };

      query.mockResolvedValue(mockResult);

      const result = await NotificationLog.updateStatus(1, 'sent', {
        providerMessageId: 'SM123456789',
      });

      expect(result).toEqual(mockResult.rows[0]);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notification_log'),
        expect.arrayContaining([1, 'sent', 'SM123456789'])
      );
    });

    it('should update notification status to failed with error', async () => {
      const mockResult = {
        rows: [
          {
            id: 1,
            status: 'failed',
            error_message: 'Network error',
            retry_count: 3,
          },
        ],
      };

      query.mockResolvedValue(mockResult);

      const result = await NotificationLog.updateStatus(1, 'failed', {
        errorMessage: 'Network error',
        retryCount: 3,
      });

      expect(result).toEqual(mockResult.rows[0]);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notification_log'),
        expect.arrayContaining([1, 'failed', 'Network error', 3])
      );
    });
  });

  describe('findById', () => {
    it('should find notification by id', async () => {
      const mockResult = {
        rows: [
          {
            id: 1,
            booking_id: 123,
            status: 'sent',
          },
        ],
      };

      query.mockResolvedValue(mockResult);

      const result = await NotificationLog.findById(1);

      expect(result).toEqual(mockResult.rows[0]);
      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM notification_log WHERE id = $1',
        [1]
      );
    });
  });

  describe('findByBookingId', () => {
    it('should find all notifications for a booking', async () => {
      const mockResult = {
        rows: [
          {
            id: 1,
            booking_id: 123,
            status: 'sent',
          },
          {
            id: 2,
            booking_id: 123,
            status: 'pending',
          },
        ],
      };

      query.mockResolvedValue(mockResult);

      const result = await NotificationLog.findByBookingId(123);

      expect(result).toEqual(mockResult.rows);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE booking_id = $1'),
        [123]
      );
    });
  });

  describe('incrementRetryCount', () => {
    it('should increment retry count', async () => {
      const mockResult = {
        rows: [
          {
            id: 1,
            retry_count: 2,
          },
        ],
      };

      query.mockResolvedValue(mockResult);

      const result = await NotificationLog.incrementRetryCount(1);

      expect(result).toEqual(mockResult.rows[0]);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('retry_count = retry_count + 1'),
        [1]
      );
    });
  });
});
