const request = require('supertest');
const express = require('express');

jest.mock('../services/whatsappService');
jest.mock('../models/NotificationLog');

const bookingsRouter = require('../routes/bookings');
const notificationsRouter = require('../routes/notifications');
const WhatsAppService = require('../services/whatsappService');
const NotificationLog = require('../models/NotificationLog');

describe('Booking and Notification Integration', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use('/api/bookings', bookingsRouter);
    app.use('/api/notifications', notificationsRouter);
  });

  describe('Complete booking workflow', () => {
    it('should create booking, send notification, and retrieve notification log', async () => {
      const mockNotification = {
        id: 1,
        booking_id: 123,
        recipient_phone: '+9876543210',
        status: 'sent',
        provider_message_id: 'SM123456789',
      };

      WhatsAppService.mockSendBookingNotification.mockResolvedValue({
        success: true,
        notificationLogId: 1,
        messageSid: 'SM123456789',
      });

      NotificationLog.findByBookingId.mockResolvedValue([mockNotification]);

      const bookingData = {
        customerName: 'John Doe',
        customerPhone: '+1234567890',
        barberPhone: '+9876543210',
        barberName: 'Jane Smith',
        appointmentTime: '2024-01-15 10:00 AM',
      };

      const createResponse = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      expect(createResponse.body.booking).toBeDefined();
      expect(createResponse.body.notification.sent).toBe(true);

      const bookingId = createResponse.body.booking.id;

      const notificationsResponse = await request(app)
        .get(`/api/notifications?bookingId=${bookingId}`)
        .expect(200);

      expect(notificationsResponse.body.notifications).toHaveLength(1);
      expect(notificationsResponse.body.notifications[0].status).toBe('sent');
    });

    it('should handle notification failure and still create booking', async () => {
      WhatsAppService.mockSendBookingNotification.mockRejectedValue(
        new Error('Twilio API error')
      );

      const bookingData = {
        customerName: 'John Doe',
        customerPhone: '+1234567890',
        barberPhone: '+9876543210',
        appointmentTime: '2024-01-15 10:00 AM',
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      expect(response.body.booking).toBeDefined();
      expect(response.body.notification.sent).toBe(false);
      expect(response.body.notification.error).toBeDefined();
    });
  });

  describe('Notification log retrieval', () => {
    it('should return 400 if bookingId is missing', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .expect(400);

      expect(response.body.error).toContain('bookingId');
    });

    it('should return empty array if no notifications found', async () => {
      NotificationLog.findByBookingId.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/notifications?bookingId=999')
        .expect(200);

      expect(response.body.notifications).toHaveLength(0);
    });
  });
});
