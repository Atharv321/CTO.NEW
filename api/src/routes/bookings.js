const express = require('express');
const WhatsAppService = require('../services/whatsappService');
const logger = require('../utils/logger');

const router = express.Router();
const whatsappService = new WhatsAppService();

router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      barberPhone,
      barberName,
      appointmentTime,
    } = req.body;

    if (!customerName || !customerPhone || !appointmentTime) {
      return res.status(400).json({
        error: 'Missing required fields: customerName, customerPhone, appointmentTime',
      });
    }

    const bookingId = Date.now();

    logger.info('Creating new booking', {
      bookingId,
      customerName,
      appointmentTime,
    });

    const booking = {
      id: bookingId,
      customerName,
      customerPhone,
      barberPhone,
      barberName,
      appointmentTime,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    if (barberPhone) {
      try {
        const notificationResult = await whatsappService.sendBookingNotification({
          bookingId,
          customerName,
          customerPhone,
          barberPhone,
          barberName,
          appointmentTime,
        });

        logger.info('Booking notification sent', {
          bookingId,
          notificationSuccess: notificationResult.success,
        });

        return res.status(201).json({
          booking,
          notification: {
            sent: notificationResult.success,
            notificationLogId: notificationResult.notificationLogId,
            messageSid: notificationResult.messageSid,
          },
        });
      } catch (error) {
        logger.error('Failed to send booking notification', {
          bookingId,
          error: error.message,
        });

        return res.status(201).json({
          booking,
          notification: {
            sent: false,
            error: 'Failed to send notification, but booking was created',
          },
        });
      }
    }

    return res.status(201).json({
      booking,
      notification: {
        sent: false,
        reason: 'No barber phone number provided',
      },
    });
  } catch (error) {
    logger.error('Failed to create booking', { error: error.message });
    return res.status(500).json({
      error: 'Failed to create booking',
      message: error.message,
    });
  }
});

module.exports = router;
