import { ChannelAdapter, NotificationMessage } from '@/types';
import { config } from '@/config';

export class SendGridMockAdapter implements ChannelAdapter {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.apiKey = config.sendgrid.apiKey;
    this.fromEmail = config.sendgrid.fromEmail;
    this.fromName = config.sendgrid.fromName;
  }

  async send(message: NotificationMessage): Promise<boolean> {
    try {
      // Mock implementation - in real scenario, this would use SendGrid API
      console.log(`[SendGrid Mock] Sending email to user ${message.userId}`);
      console.log(`[SendGrid Mock] From: ${this.fromName} <${this.fromEmail}>`);
      console.log(`[SendGrid Mock] Subject: ${message.subject}`);
      console.log(`[SendGrid Mock] Content: ${message.content}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Mock success (90% success rate for testing)
      const success = Math.random() > 0.1;
      
      if (!success) {
        throw new Error('Mock SendGrid API failure');
      }
      
      console.log(`[SendGrid Mock] Email sent successfully for message ${message.id}`);
      return true;
    } catch (error) {
      console.error(`[SendGrid Mock] Failed to send email for message ${message.id}:`, error);
      return false;
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      // Mock validation - in real scenario, this would validate API key
      if (!this.apiKey) {
        console.warn('[SendGrid Mock] No API key provided');
        return false;
      }
      
      if (!this.fromEmail) {
        console.warn('[SendGrid Mock] No from email provided');
        return false;
      }
      
      console.log('[SendGrid Mock] Configuration validated successfully');
      return true;
    } catch (error) {
      console.error('[SendGrid Mock] Configuration validation failed:', error);
      return false;
    }
  }
}