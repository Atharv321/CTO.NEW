import { 
  AlertEvent, 
  AlertEventType, 
  AlertSeverity, 
  NotificationChannel, 
  NotificationChannelType,
  UserNotificationPreference,
  Notification,
  NotificationStatus,
  InAppNotification
} from '@shared/types';
import db from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';

export interface NotificationProvider {
  send(notification: Notification, alertEvent: AlertEvent, user: any): Promise<boolean>;
}

export class EmailNotificationProvider implements NotificationProvider {
  async send(notification: Notification, alertEvent: AlertEvent, user: any): Promise<boolean> {
    try {
      // Mock SendGrid implementation
      console.log(`📧 Email sent to ${user.email}:`);
      console.log(`Subject: ${alertEvent.title}`);
      console.log(`Message: ${alertEvent.message}`);
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Simulate 95% success rate
      if (Math.random() > 0.05) {
        return true;
      }
      throw new Error('Mock email service failure');
    } catch (error) {
      console.error('Email notification failed:', error);
      return false;
    }
  }
}

export class SMSNotificationProvider implements NotificationProvider {
  async send(notification: Notification, alertEvent: AlertEvent, user: any): Promise<boolean> {
    try {
      // Mock SMS provider implementation
      console.log(`📱 SMS sent to ${user.phone}:`);
      console.log(`${alertEvent.title}: ${alertEvent.message}`);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      if (Math.random() > 0.1) {
        return true;
      }
      throw new Error('Mock SMS service failure');
    } catch (error) {
      console.error('SMS notification failed:', error);
      return false;
    }
  }
}

export class PushNotificationProvider implements NotificationProvider {
  async send(notification: Notification, alertEvent: AlertEvent, user: any): Promise<boolean> {
    try {
      // Mock push notification implementation
      console.log(`🔔 Push notification sent to user ${user.id}:`);
      console.log(`Title: ${alertEvent.title}`);
      console.log(`Message: ${alertEvent.message}`);
      
      await new Promise(resolve => setTimeout(resolve, 30));
      
      if (Math.random() > 0.15) {
        return true;
      }
      throw new Error('Mock push service failure');
    } catch (error) {
      console.error('Push notification failed:', error);
      return false;
    }
  }
}

export class InAppNotificationProvider implements NotificationProvider {
  async send(notification: Notification, alertEvent: AlertEvent, user: any): Promise<boolean> {
    try {
      const inAppNotification = {
        id: uuidv4(),
        userId: user.id,
        title: alertEvent.title,
        message: alertEvent.message,
        severity: alertEvent.severity,
        read: false,
        createdAt: new Date()
      };

      await db.query(
        `INSERT INTO in_app_notifications (id, user_id, title, message, severity, read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          inAppNotification.id,
          inAppNotification.userId,
          inAppNotification.title,
          inAppNotification.message,
          inAppNotification.severity,
          inAppNotification.read,
          inAppNotification.createdAt
        ]
      );

      console.log(`📱 In-app notification created for user ${user.id}`);
      return true;
    } catch (error) {
      console.error('In-app notification failed:', error);
      return false;
    }
  }
}

export class NotificationService {
  private providers: Map<NotificationChannelType, NotificationProvider>;
  private processingQueue: boolean = false;

  constructor() {
    this.providers = new Map([
      [NotificationChannelType.EMAIL, new EmailNotificationProvider()],
      [NotificationChannelType.SMS, new SMSNotificationProvider()],
      [NotificationChannelType.PUSH, new PushNotificationProvider()],
      [NotificationChannelType.IN_APP, new InAppNotificationProvider()]
    ]);
  }

  async createAlertEvent(alertData: Omit<AlertEvent, 'id' | 'createdAt'>): Promise<AlertEvent> {
    const alertEvent: AlertEvent = {
      id: uuidv4(),
      ...alertData,
      createdAt: new Date()
    };

    await db.query(
      `INSERT INTO alert_events (id, type, severity, title, message, data, user_id, location_id, product_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        alertEvent.id,
        alertEvent.type,
        alertEvent.severity,
        alertEvent.title,
        alertEvent.message,
        JSON.stringify(alertEvent.data),
        alertEvent.userId,
        alertEvent.locationId,
        alertEvent.productId,
        alertEvent.createdAt
      ]
    );

    return alertEvent;
  }

  async processAlertEvent(alertEventId: string): Promise<void> {
    const alertEventResult = await db.query(
      'SELECT * FROM alert_events WHERE id = $1',
      [alertEventId]
    );

    if (alertEventResult.rows.length === 0) {
      throw new Error(`Alert event ${alertEventId} not found`);
    }

    const alertEvent = alertEventResult.rows[0];

    // Get users who should receive this alert
    const usersToNotify = await this.getUsersToNotify(alertEvent);

    // Create notifications for each user and channel
    for (const { user, preferences, channels } of usersToNotify) {
      for (const channel of channels) {
        const notification: Notification = {
          id: uuidv4(),
          userId: user.id,
          alertEventId: alertEvent.id,
          channelType: channel.type,
          status: NotificationStatus.PENDING,
          retryCount: 0,
          createdAt: new Date()
        };

        await db.query(
          `INSERT INTO notifications (id, user_id, alert_event_id, channel_type, status, retry_count, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            notification.id,
            notification.userId,
            notification.alertEventId,
            notification.channelType,
            notification.status,
            notification.retryCount,
            notification.createdAt
          ]
        );
      }
    }

    // Mark alert event as processed
    await db.query(
      'UPDATE alert_events SET processed_at = $1 WHERE id = $2',
      [new Date(), alertEventId]
    );
  }

  private async getUsersToNotify(alertEvent: any): Promise<Array<{ user: any, preferences: any, channels: NotificationChannel[] }>> {
    const query = `
      SELECT u.*, unp.alert_types, unp.channels, unp.min_severity, unp.quiet_hours, unp.is_active as preferences_active
      FROM users u
      LEFT JOIN user_notification_preferences unp ON u.id = unp.user_id
      WHERE (unp.is_active = true OR unp.is_active IS NULL)
        AND u.role IN ('admin', 'manager', 'analyst')
    `;

    const result = await db.query(query);
    const usersToNotify = [];

    for (const row of result.rows) {
      // Check if user has preferences or use defaults
      const preferences = row.alert_types ? {
        alertTypes: row.alert_types,
        channels: row.channels,
        minSeverity: row.min_severity,
        quietHours: row.quiet_hours,
        isActive: row.preferences_active
      } : this.getDefaultPreferences(row.role);

      // Check if alert type is enabled for this user
      if (!preferences.alertTypes.includes(alertEvent.type)) {
        continue;
      }

      // Check severity threshold
      if (!this.meetsSeverityThreshold(alertEvent.severity, preferences.minSeverity)) {
        continue;
      }

      // Check quiet hours
      if (this.isInQuietHours(preferences.quietHours)) {
        continue;
      }

      // Filter enabled channels
      const enabledChannels = preferences.channels.filter((channel: NotificationChannel) => channel.enabled);

      if (enabledChannels.length > 0) {
        usersToNotify.push({
          user: {
            id: row.id,
            email: row.email,
            name: row.name,
            role: row.role,
            phone: row.phone || '+1234567890' // Mock phone number
          },
          preferences,
          channels: enabledChannels
        });
      }
    }

    return usersToNotify;
  }

  private getDefaultPreferences(role: string): any {
    const basePreferences = {
      alertTypes: [AlertEventType.LOW_STOCK, AlertEventType.CRITICAL_STOCK],
      channels: [
        { type: NotificationChannelType.EMAIL, enabled: true, config: {} },
        { type: NotificationChannelType.IN_APP, enabled: true, config: {} }
      ],
      minSeverity: AlertSeverity.MEDIUM,
      quietHours: null
    };

    if (role === 'admin') {
      basePreferences.alertTypes = Object.values(AlertEventType);
      basePreferences.channels.push(
        { type: NotificationChannelType.SMS, enabled: false, config: {} },
        { type: NotificationChannelType.PUSH, enabled: false, config: {} }
      );
      basePreferences.minSeverity = AlertSeverity.LOW;
    }

    return basePreferences;
  }

  private meetsSeverityThreshold(alertSeverity: AlertSeverity, minSeverity: AlertSeverity): boolean {
    const severityOrder = {
      [AlertSeverity.LOW]: 1,
      [AlertSeverity.MEDIUM]: 2,
      [AlertSeverity.HIGH]: 3,
      [AlertSeverity.CRITICAL]: 4
    };

    return severityOrder[alertSeverity] >= severityOrder[minSeverity];
  }

  private isInQuietHours(quietHours: { start: string, end: string } | null): boolean {
    if (!quietHours) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = quietHours.start.split(':').map(Number);
    const [endHour, endMin] = quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight quiet hours (e.g., 22:00 to 06:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  async processNotificationQueue(): Promise<void> {
    if (this.processingQueue) {
      return;
    }

    this.processingQueue = true;

    try {
      const pendingNotifications = await db.query(
        `SELECT n.*, ae.*, u.email, u.name, u.role, u.phone
         FROM notifications n
         JOIN alert_events ae ON n.alert_event_id = ae.id
         JOIN users u ON n.user_id = u.id
         WHERE n.status = 'pending'
         ORDER BY n.created_at ASC
         LIMIT 50`
      );

      for (const notificationRow of pendingNotifications.rows) {
        await this.processNotification(notificationRow);
      }
    } catch (error) {
      console.error('Error processing notification queue:', error);
    } finally {
      this.processingQueue = false;
    }
  }

  private async processNotification(notificationRow: any): Promise<void> {
    const provider = this.providers.get(notificationRow.channel_type as NotificationChannelType);
    
    if (!provider) {
      console.error(`No provider found for channel type: ${notificationRow.channel_type}`);
      return;
    }

    try {
      const alertEvent = {
        id: notificationRow.alert_event_id,
        type: notificationRow.type,
        severity: notificationRow.severity,
        title: notificationRow.title,
        message: notificationRow.message,
        data: notificationRow.data
      };

      const user = {
        id: notificationRow.user_id,
        email: notificationRow.email,
        name: notificationRow.name,
        role: notificationRow.role,
        phone: notificationRow.phone
      };

      const notification = {
        id: notificationRow.id,
        userId: notificationRow.user_id,
        alertEventId: notificationRow.alert_event_id,
        channelType: notificationRow.channel_type,
        status: notificationRow.status,
        retryCount: notificationRow.retry_count
      };

      const success = await provider.send(notification, alertEvent, user);

      if (success) {
        await db.query(
          `UPDATE notifications 
           SET status = 'sent', sent_at = $1 
           WHERE id = $2`,
          [new Date(), notification.id]
        );
      } else {
        throw new Error('Provider send failed');
      }
    } catch (error) {
      const retryCount = notificationRow.retry_count + 1;
      const maxRetries = 3;

      if (retryCount >= maxRetries) {
        await db.query(
          `UPDATE notifications 
           SET status = 'failed', error = $1, retry_count = $2 
           WHERE id = $3`,
          [error.message, retryCount, notificationRow.id]
        );
      } else {
        await db.query(
          `UPDATE notifications 
           SET status = 'retrying', error = $1, retry_count = $2 
           WHERE id = $3`,
          [error.message, retryCount, notificationRow.id]
        );
      }
    }
  }

  async getInAppNotifications(userId: string, unreadOnly: boolean = false): Promise<InAppNotification[]> {
    const query = `
      SELECT * FROM in_app_notifications 
      WHERE user_id = $1 ${unreadOnly ? 'AND read = false' : ''}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      message: row.message,
      severity: row.severity,
      read: row.read,
      createdAt: row.created_at,
      readAt: row.read_at
    }));
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
    const result = await db.query(
      `UPDATE in_app_notifications 
       SET read = true, read_at = $1 
       WHERE id = $2 AND user_id = $3`,
      [new Date(), notificationId, userId]
    );

    return result.rowCount > 0;
  }

  async markAllNotificationsAsRead(userId: string): Promise<number> {
    const result = await db.query(
      `UPDATE in_app_notifications 
       SET read = true, read_at = $1 
       WHERE user_id = $2 AND read = false`,
      [new Date(), userId]
    );

    return result.rowCount;
  }
}

export default new NotificationService();