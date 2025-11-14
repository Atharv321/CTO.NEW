require('dotenv').config();

const config = {
  enabled: process.env.WHATSAPP_ENABLED === 'true',
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
  maxRetries: parseInt(process.env.WHATSAPP_MAX_RETRIES || '3', 10),
  retryDelay: parseInt(process.env.WHATSAPP_RETRY_DELAY || '5000', 10),
  timeout: parseInt(process.env.WHATSAPP_TIMEOUT || '30000', 10),
};

const validateConfig = () => {
  if (config.enabled) {
    if (!config.accountSid) {
      throw new Error('TWILIO_ACCOUNT_SID is required when WhatsApp is enabled');
    }
    if (!config.authToken) {
      throw new Error('TWILIO_AUTH_TOKEN is required when WhatsApp is enabled');
    }
  }
};

module.exports = {
  config,
  validateConfig,
};
