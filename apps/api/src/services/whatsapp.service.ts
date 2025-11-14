import { WhatsAppMessage } from '../templates/whatsapp-messages.js';

export interface WhatsAppServiceConfig {
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
  apiUrl?: string;
}

export class WhatsAppService {
  private config: WhatsAppServiceConfig;
  private rateLimitDelay: number = 1000; // 1 second between messages

  constructor(config: WhatsAppServiceConfig = {}) {
    this.config = {
      accountSid: config.accountSid || process.env.WHATSAPP_ACCOUNT_SID,
      authToken: config.authToken || process.env.WHATSAPP_AUTH_TOKEN,
      fromNumber: config.fromNumber || process.env.WHATSAPP_FROM_NUMBER,
      apiUrl: config.apiUrl || process.env.WHATSAPP_API_URL || 'https://api.whatsapp.com',
    };
  }

  /**
   * Send a WhatsApp message
   * In production, this would integrate with Twilio, WhatsApp Business API, or similar
   */
  async sendMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Validate phone number format
      this.validatePhoneNumber(message.to);

      // Rate limiting
      await this.rateLimit();

      // In production, implement actual WhatsApp API call
      // For now, we'll simulate the call
      const messageId = this.generateMessageId();

      console.log(`[WhatsApp] Sending message to ${message.to}`);
      console.log(`[WhatsApp] Message ID: ${messageId}`);
      console.log(`[WhatsApp] Body: ${message.body.substring(0, 100)}...`);

      // Simulate API call
      if (process.env.NODE_ENV === 'test') {
        return { success: true, messageId };
      }

      // In production, replace with actual API call:
      // const response = await fetch(`${this.config.apiUrl}/messages`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.config.authToken}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     from: this.config.fromNumber,
      //     to: message.to,
      //     body: message.body,
      //   }),
      // });

      return { success: true, messageId };
    } catch (error) {
      console.error('[WhatsApp] Failed to send message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate phone number format (E.164 format)
   */
  private validatePhoneNumber(phoneNumber: string): void {
    // E.164 format: +[country code][number]
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    
    if (!e164Regex.test(phoneNumber)) {
      throw new Error(`Invalid phone number format: ${phoneNumber}. Expected E.164 format (e.g., +1234567890)`);
    }
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Rate limiting to avoid overwhelming the API
   */
  private async rateLimit(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, this.rateLimitDelay);
    });
  }

  /**
   * Check service health and configuration
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    if (!this.config.accountSid || !this.config.authToken || !this.config.fromNumber) {
      return {
        healthy: false,
        message: 'WhatsApp service not configured. Missing required environment variables.',
      };
    }

    return {
      healthy: true,
      message: 'WhatsApp service configured and ready',
    };
  }
}

// Singleton instance
export const whatsappService = new WhatsAppService();
