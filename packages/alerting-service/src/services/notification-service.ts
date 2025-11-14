import { 
  ChannelAdapter, 
  NotificationChannel, 
  NotificationMessage, 
  UserNotificationPreference,
  EventType 
} from '@/types';
import { SendGridMockAdapter } from './sendgrid-mock-adapter';
import { SMSMockAdapter, PushMockAdapter, InAppMockAdapter } from './channel-adapters';

export class NotificationService {
  private adapters: Map<NotificationChannel, ChannelAdapter> = new Map();
  private userPreferences: Map<string, UserNotificationPreference> = new Map();

  constructor() {
    this.initializeAdapters();
    this.loadMockUserPreferences();
  }

  private initializeAdapters(): void {
    this.adapters.set('EMAIL', new SendGridMockAdapter());
    this.adapters.set('SMS', new SMSMockAdapter());
    this.adapters.set('PUSH', new PushMockAdapter());
    this.adapters.set('IN_APP', new InAppMockAdapter());
  }

  private loadMockUserPreferences(): void {
    // Mock user preferences for testing
    const mockPreferences: UserNotificationPreference[] = [
      {
        userId: 'user1',
        email: 'user1@example.com',
        phoneNumber: '+1234567890',
        preferences: {
          LOW_STOCK: ['EMAIL', 'IN_APP'],
          IMMINENT_EXPIRATION: ['EMAIL', 'SMS'],
          SUPPLIER_ORDER_UPDATE: ['EMAIL', 'PUSH', 'IN_APP']
        },
        isEnabled: true
      },
      {
        userId: 'user2',
        email: 'user2@example.com',
        preferences: {
          LOW_STOCK: ['IN_APP'],
          IMMINENT_EXPIRATION: ['EMAIL'],
          SUPPLIER_ORDER_UPDATE: ['PUSH']
        },
        isEnabled: true
      }
    ];

    mockPreferences.forEach(pref => {
      this.userPreferences.set(pref.userId, pref);
    });
  }

  async sendNotification(message: NotificationMessage): Promise<boolean> {
    const adapter = this.adapters.get(message.channel);
    if (!adapter) {
      console.error(`No adapter found for channel: ${message.channel}`);
      return false;
    }

    try {
      const success = await adapter.send(message);
      return success;
    } catch (error) {
      console.error(`Failed to send notification via ${message.channel}:`, error);
      return false;
    }
  }

  async sendNotificationsForEvent(
    eventId: string,
    eventType: EventType,
    userId: string,
    subject: string,
    content: string
  ): Promise<NotificationMessage[]> {
    const preferences = this.userPreferences.get(userId);
    if (!preferences || !preferences.isEnabled) {
      console.log(`User ${userId} has notifications disabled or no preferences found`);
      return [];
    }

    const channels = preferences.preferences[eventType] || [];
    const messages: NotificationMessage[] = [];

    for (const channel of channels) {
      const message: NotificationMessage = {
        id: `${eventId}-${channel}-${Date.now()}`,
        eventId,
        userId,
        channel,
        subject,
        content,
        sent: false
      };

      const success = await this.sendNotification(message);
      message.sent = success;
      message.sentAt = success ? new Date() : undefined;

      messages.push(message);
    }

    return messages;
  }

  getUserPreferences(userId: string): UserNotificationPreference | undefined {
    return this.userPreferences.get(userId);
  }

  updateUserPreferences(preferences: UserNotificationPreference): void {
    this.userPreferences.set(preferences.userId, preferences);
  }

  async validateAllAdapters(): Promise<boolean> {
    let allValid = true;
    
    for (const [channel, adapter] of this.adapters) {
      const isValid = await adapter.validateConfig();
      if (!isValid) {
        console.error(`Adapter for channel ${channel} failed validation`);
        allValid = false;
      }
    }

    return allValid;
  }

  getInAppNotifications(userId: string): NotificationMessage[] {
    const inAppAdapter = this.adapters.get('IN_APP') as InAppMockAdapter;
    if (inAppAdapter && 'getNotifications' in inAppAdapter) {
      return inAppAdapter.getNotifications(userId);
    }
    return [];
  }

  clearInAppNotifications(userId: string): void {
    const inAppAdapter = this.adapters.get('IN_APP') as InAppMockAdapter;
    if (inAppAdapter && 'clearNotifications' in inAppAdapter) {
      inAppAdapter.clearNotifications(userId);
    }
  }
}