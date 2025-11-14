import { NotificationAdapter, NotificationMessage } from '../types/alerts';

export class SendGridAdapter implements NotificationAdapter {
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail: string) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  async send(message: NotificationMessage): Promise<boolean> {
    try {
      // Mock SendGrid implementation
      console.log(`[SendGrid] Sending email to user ${message.userId}`);
      console.log(`[SendGrid] From: ${this.fromEmail}`);
      console.log(`[SendGrid] Subject: ${message.subject}`);
      console.log(`[SendGrid] Body: ${message.body}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Mock success/failure based on message content for testing
      if (message.body.includes('fail')) {
        throw new Error('Mock SendGrid failure');
      }
      
      console.log(`[SendGrid] Email sent successfully`);
      return true;
    } catch (error) {
      console.error(`[SendGrid] Failed to send email:`, error);
      return false;
    }
  }
}

export class MockSMSAdapter implements NotificationAdapter {
  async send(message: NotificationMessage): Promise<boolean> {
    try {
      console.log(`[SMS] Sending SMS to user ${message.userId}`);
      console.log(`[SMS] Message: ${message.body}`);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      console.log(`[SMS] SMS sent successfully`);
      return true;
    } catch (error) {
      console.error(`[SMS] Failed to send SMS:`, error);
      return false;
    }
  }
}

export class MockPushAdapter implements NotificationAdapter {
  async send(message: NotificationMessage): Promise<boolean> {
    try {
      console.log(`[Push] Sending push notification to user ${message.userId}`);
      console.log(`[Push] Title: ${message.subject}`);
      console.log(`[Push] Body: ${message.body}`);
      
      await new Promise(resolve => setTimeout(resolve, 30));
      
      console.log(`[Push] Push notification sent successfully`);
      return true;
    } catch (error) {
      console.error(`[Push] Failed to send push notification:`, error);
      return false;
    }
  }
}

export class InAppAdapter implements NotificationAdapter {
  private storage: Map<string, any[]> = new Map();

  async send(message: NotificationMessage): Promise<boolean> {
    try {
      const notification = {
        id: message.id,
        userId: message.userId,
        title: message.subject,
        message: message.body,
        read: false,
        createdAt: new Date()
      };

      const userNotifications = this.storage.get(message.userId) || [];
      userNotifications.push(notification);
      this.storage.set(message.userId, userNotifications);

      console.log(`[InApp] Stored notification for user ${message.userId}`);
      return true;
    } catch (error) {
      console.error(`[InApp] Failed to store notification:`, error);
      return false;
    }
  }

  getNotifications(userId: string): any[] {
    return this.storage.get(userId) || [];
  }

  markAsRead(userId: string, notificationId: string): boolean {
    const notifications = this.storage.get(userId) || [];
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      notification.readAt = new Date();
      return true;
    }
    return false;
  }
}