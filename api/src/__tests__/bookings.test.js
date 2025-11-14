const request = require('supertest');
const express = require('express');

jest.mock('../services/whatsappService');

const bookingsRouter = require('../routes/bookings');
const WhatsAppService = require('../services/whatsappService');

describe('Bookings API', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use('/api/bookings', bookingsRouter);
  });

  describe('POST /api/bookings', () => {
    it('should create a booking and send notification', async () => {
      WhatsAppService.mockSendBookingNotification.mockResolvedValue({
        success: true,
        notificationLogId: 1,
        messageSid: 'SM123456789',
      });

      const bookingData = {
        customerName: 'John Doe',
        customerPhone: '+1234567890',
        barberPhone: '+9876543210',
        barberName: 'Jane Smith',
        appointmentTime: '2024-01-15 10:00 AM',
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      expect(response.body.booking).toBeDefined();
      expect(response.body.booking.customerName).toBe('John Doe');
      expect(response.body.notification.sent).toBe(true);
      expect(response.body.notification.notificationLogId).toBe(1);
      expect(WhatsAppService.mockSendBookingNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: 'John Doe',
          barberPhone: '+9876543210',
        })
      );
    });

    it('should create booking without notification if no barber phone', async () => {
      const bookingData = {
        customerName: 'John Doe',
        customerPhone: '+1234567890',
        appointmentTime: '2024-01-15 10:00 AM',
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      expect(response.body.booking).toBeDefined();
      expect(response.body.notification.sent).toBe(false);
      expect(response.body.notification.reason).toBe('No barber phone number provided');
      expect(WhatsAppService.mockSendBookingNotification).not.toHaveBeenCalled();
    });

    it('should return 400 if required fields are missing', async () => {
      const bookingData = {
        customerName: 'John Doe',
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(400);

      expect(response.body.error).toContain('Missing required fields');
    });

    it('should handle notification failure gracefully', async () => {
      WhatsAppService.mockSendBookingNotification.mockRejectedValue(
        new Error('Twilio error')
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
      expect(response.body.notification.error).toContain('Failed to send notification');
    });
  });
});
