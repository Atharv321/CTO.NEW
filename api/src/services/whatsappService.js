const twilio = require('twilio');
const { config, validateConfig } = require('../config/whatsapp');
const logger = require('../utils/logger');
const NotificationLog = require('../models/NotificationLog');
const { generateMessage } = require('../utils/messageTemplates');

class WhatsAppService {
  constructor(twilioClient = null) {
    this.client = twilioClient;
    this.config = config;
    
    if (!twilioClient && config.enabled) {
      try {
        validateConfig();
        this.client = twilio(config.accountSid, config.authToken);
        logger.info('WhatsApp service initialized with Twilio');
      } catch (error) {
        logger.error('Failed to initialize WhatsApp service', { error: error.message });
        throw error;
      }
    }
  }

  async sendMessage(to, message, bookingId = null) {
    if (!config.enabled) {
      logger.info('WhatsApp is disabled, skipping message send', { to, bookingId });
      return { success: false, reason: 'service_disabled' };
    }

    if (!this.client) {
      throw new Error('Twilio client not initialized');
    }

    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    try {
      logger.info('Sending WhatsApp message', { to: formattedTo, bookingId });
      
      const result = await this.client.messages.create({
        body: message,
        from: config.whatsappNumber,
        to: formattedTo,
      });

      logger.info('WhatsApp message sent successfully', {
        messageSid: result.sid,
        to: formattedTo,
        status: result.status,
        bookingId,
      });

      return {
        success: true,
        messageSid: result.sid,
        status: result.status,
      };
    } catch (error) {
      logger.error('Failed to send WhatsApp message', {
        error: error.message,
        code: error.code,
        to: formattedTo,
        bookingId,
      });

      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async sendTemplatedMessage(to, templateName, templateData, bookingId = null) {
    try {
      const message = generateMessage(templateName, templateData);
      return await this.sendMessage(to, message, bookingId);
    } catch (error) {
      logger.error('Failed to generate templated message', {
        error: error.message,
        templateName,
        to,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendBookingNotification(bookingData) {
    const {
      bookingId,
      customerName,
      customerPhone,
      barberPhone,
      barberName,
      appointmentTime,
    } = bookingData;

    if (!barberPhone) {
      logger.warn('No barber phone number provided, skipping notification', { bookingId });
      return { success: false, reason: 'no_recipient' };
    }

    const templateData = {
      customerName,
      phone: customerPhone,
      appointmentTime,
      barberName,
    };

    const message = generateMessage('booking_confirmation', templateData);

    const notificationLog = await NotificationLog.create({
      bookingId,
      recipientPhone: barberPhone,
      recipientName: barberName || 'Barber',
      messageType: 'booking_confirmation',
      messageTemplate: 'booking_confirmation',
      messageContent: message,
      status: 'pending',
      provider: 'twilio',
    });

    logger.info('Created notification log entry', {
      notificationId: notificationLog.id,
      bookingId,
    });

    return await this.sendWithRetry(barberPhone, message, notificationLog.id, bookingId);
  }

  async sendWithRetry(to, message, notificationLogId, bookingId = null, attempt = 1) {
    const result = await this.sendMessage(to, message, bookingId);

    if (result.success) {
      await NotificationLog.updateStatus(notificationLogId, 'sent', {
        providerMessageId: result.messageSid,
      });

      return {
        success: true,
        notificationLogId,
        messageSid: result.messageSid,
      };
    }

    if (attempt < config.maxRetries) {
      logger.info(`Retrying message send (attempt ${attempt + 1}/${config.maxRetries})`, {
        notificationLogId,
        bookingId,
      });

      await NotificationLog.incrementRetryCount(notificationLogId);

      await new Promise(resolve => setTimeout(resolve, config.retryDelay * attempt));

      return await this.sendWithRetry(to, message, notificationLogId, bookingId, attempt + 1);
    }

    await NotificationLog.updateStatus(notificationLogId, 'failed', {
      errorMessage: result.error || 'Max retries exceeded',
      retryCount: attempt,
    });

    logger.error('Failed to send message after retries', {
      notificationLogId,
      bookingId,
      attempts: attempt,
    });

    return {
      success: false,
      notificationLogId,
      error: result.error,
      attempts: attempt,
    };
  }
}

module.exports = WhatsAppService;
