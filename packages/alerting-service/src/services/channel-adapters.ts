import { ChannelAdapter, NotificationMessage } from '@/types';

export class SMSMockAdapter implements ChannelAdapter {
  private apiKey: string;

  constructor(apiKey: string = '') {
    this.apiKey = apiKey;
  }

  async send(message: NotificationMessage): Promise<boolean> {
    try {
      console.log(`[SMS Mock] Sending SMS to user ${message.userId}`);
      console.log(`[SMS Mock] Content: ${message.content}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Mock success (85% success rate for testing)
      const success = Math.random() > 0.15;
      
      if (!success) {
        throw new Error('Mock SMS API failure');
      }
      
      console.log(`[SMS Mock] SMS sent successfully for message ${message.id}`);
      return true;
    } catch (error) {
      console.error(`[SMS Mock] Failed to send SMS for message ${message.id}:`, error);
      return false;
    }
  }

  async validateConfig(): Promise<boolean> {
    console.log('[SMS Mock] Configuration validated successfully');
    return true;
  }
}

export class PushMockAdapter implements ChannelAdapter {
  private apiKey: string;

  constructor(apiKey: string = '') {
    this.apiKey = apiKey;
  }

  async send(message: NotificationMessage): Promise<boolean> {
    try {
      console.log(`[Push Mock] Sending push notification to user ${message.userId}`);
      console.log(`[Push Mock] Title: ${message.subject}`);
      console.log(`[Push Mock] Body: ${message.content}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Mock success (95% success rate for testing)
      const success = Math.random() > 0.05;
      
      if (!success) {
        throw new Error('Mock Push API failure');
      }
      
      console.log(`[Push Mock] Push notification sent successfully for message ${message.id}`);
      return true;
    } catch (error) {
      console.error(`[Push Mock] Failed to send push notification for message ${message.id}:`, error);
      return false;
    }
  }

  async validateConfig(): Promise<boolean> {
    console.log('[Push Mock] Configuration validated successfully');
    return true;
  }
}

export class InAppMockAdapter implements ChannelAdapter {
  private notifications: Map<string, NotificationMessage[]> = new Map();

  async send(message: NotificationMessage): Promise<boolean> {
    try {
      console.log(`[In-App Mock] Storing in-app notification for user ${message.userId}`);
      console.log(`[In-App Mock] Title: ${message.subject}`);
      console.log(`[In-App Mock] Content: ${message.content}`);
      
      // Store notification in memory (in real scenario, this would be in database)
      const userNotifications = this.notifications.get(message.userId) || [];
      userNotifications.push({
        ...message,
        sent: true,
        sentAt: new Date()
      });
      this.notifications.set(message.userId, userNotifications);
      
      console.log(`[In-App Mock] In-app notification stored successfully for message ${message.id}`);
      return true;
    } catch (error) {
      console.error(`[In-App Mock] Failed to store in-app notification for message ${message.id}:`, error);
      return false;
    }
  }

  async validateConfig(): Promise<boolean> {
    console.log('[In-App Mock] Configuration validated successfully');
    return true;
  }

  getNotifications(userId: string): NotificationMessage[] {
    return this.notifications.get(userId) || [];
  }

  clearNotifications(userId: string): void {
    this.notifications.delete(userId);
  }
}