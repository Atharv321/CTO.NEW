import {
  NotificationEvent,
  UserNotificationPreferences,
  NotificationMessage,
  NotificationAdapter,
  AlertThreshold
} from '@shared/types';

export class NotificationService {
  private adapters: Map<string, NotificationAdapter> = new Map();
  private preferences: Map<string, UserNotificationPreferences> = new Map();
  private thresholds: Map<string, AlertThreshold[]> = new Map();
  private messageQueue: NotificationMessage[] = [];

  constructor() {
    this.setupDefaultThresholds();
  }

  registerAdapter(type: string, adapter: NotificationAdapter): void {
    this.adapters.set(type, adapter);
  }

  setUserPreferences(preferences: UserNotificationPreferences): void {
    this.preferences.set(preferences.userId, preferences);
  }

  getUserPreferences(userId: string): UserNotificationPreferences | undefined {
    return this.preferences.get(userId);
  }

  private setupDefaultThresholds(): void {
    this.thresholds.set('low_stock', [
      { type: 'low_stock', value: 10, unit: 'items' },
      { type: 'low_stock', value: 5, unit: 'items' }
    ]);
    
    this.thresholds.set('impending_expiration', [
      { type: 'impending_expiration', value: 7, unit: 'days' },
      { type: 'impending_expiration', value: 3, unit: 'days' }
    ]);
  }

  async processEvent(event: NotificationEvent): Promise<void> {
    const preferences = this.preferences.get(event.userId);
    
    if (!preferences) {
      console.log(`No preferences found for user ${event.userId}, skipping notification`);
      return;
    }

    if (!this.shouldSendNotification(event, preferences)) {
      console.log(`Notification filtered out for user ${event.userId}`);
      return;
    }

    const enabledChannels = preferences.channels.filter(c => c.enabled);
    
    for (const channel of enabledChannels) {
      const message = this.createMessage(event, channel.type);
      this.messageQueue.push(message);
    }
  }

  private shouldSendNotification(event: NotificationEvent, preferences: UserNotificationPreferences): boolean {
    // Check if event type is enabled
    if (!preferences.eventTypes.includes(event.type)) {
      return false;
    }

    // Check priority threshold
    const priorityLevels = { low: 0, medium: 1, high: 2 };
    if (priorityLevels[event.priority] < priorityLevels[preferences.minPriority]) {
      return false;
    }

    // Check quiet hours
    if (preferences.quietHours) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (this.isTimeInRange(currentTime, preferences.quietHours.start, preferences.quietHours.end)) {
        return false;
      }
    }

    return true;
  }

  private isTimeInRange(current: string, start: string, end: string): boolean {
    const currentMinutes = this.timeToMinutes(current);
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight range (e.g., 22:00 to 06:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private createMessage(event: NotificationEvent, channel: string): NotificationMessage {
    const { subject, body } = this.generateMessageContent(event);
    
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventId: event.id,
      userId: event.userId,
      channel: channel as any,
      subject,
      body,
      status: 'pending',
      attempts: 0,
      createdAt: new Date()
    };
  }

  private generateMessageContent(event: NotificationEvent): { subject: string; body: string } {
    switch (event.type) {
      case 'low_stock':
        return {
          subject: `Low Stock Alert: ${event.data.itemName}`,
          body: `Item "${event.data.itemName}" is running low with only ${event.data.currentStock} units remaining. Reorder recommended.`
        };
      
      case 'impending_expiration':
        return {
          subject: `Expiration Alert: ${event.data.itemName}`,
          body: `Item "${event.data.itemName}" will expire in ${event.data.daysUntilExpiration} days on ${event.data.expirationDate}.`
        };
      
      case 'supplier_order_update':
        return {
          subject: `Order Update: ${event.data.orderNumber}`,
          body: `Your order ${event.data.orderNumber} has been updated to status: ${event.data.status}.`
        };
      
      default:
        return {
          subject: 'Notification',
          body: 'You have a new notification.'
        };
    }
  }

  async processQueue(): Promise<void> {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      await this.sendMessage(message);
    }
  }

  private async sendMessage(message: NotificationMessage): Promise<void> {
    const adapter = this.adapters.get(message.channel);
    
    if (!adapter) {
      console.error(`No adapter found for channel: ${message.channel}`);
      return;
    }

    message.attempts++;
    message.lastAttempt = new Date();

    try {
      const success = await adapter.send(message);
      
      if (success) {
        message.status = 'sent';
        message.sentAt = new Date();
        console.log(`Message ${message.id} sent successfully via ${message.channel}`);
      } else {
        message.status = 'failed';
        console.log(`Message ${message.id} failed to send via ${message.channel}`);
      }
    } catch (error) {
      message.status = 'failed';
      console.error(`Error sending message ${message.id}:`, error);
    }
  }

  checkThresholds(eventType: string, value: number): AlertThreshold[] {
    const thresholds = this.thresholds.get(eventType) || [];
    return thresholds.filter(threshold => value <= threshold.value);
  }
}