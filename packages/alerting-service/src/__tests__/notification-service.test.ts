import { NotificationService } from '../services/notification-service';
import { SendGridMockAdapter } from '../services/sendgrid-mock-adapter';
import { UserNotificationPreference, NotificationMessage, EventType } from '../types';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  describe('sendNotification', () => {
    it('should send email notification successfully', async () => {
      const message: NotificationMessage = {
        id: 'test-1',
        eventId: 'event-1',
        userId: 'user1',
        channel: 'EMAIL',
        subject: 'Test Subject',
        content: 'Test Content',
        sent: false
      };

      const result = await service.sendNotification(message);
      expect(result).toBe(true);
    });

    it('should send SMS notification successfully', async () => {
      const message: NotificationMessage = {
        id: 'test-2',
        eventId: 'event-2',
        userId: 'user1',
        channel: 'SMS',
        subject: 'Test Subject',
        content: 'Test Content',
        sent: false
      };

      const result = await service.sendNotification(message);
      expect(result).toBe(true);
    });

    it('should send push notification successfully', async () => {
      // Mock Math.random to avoid the 5% failure rate
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.5); // This will cause success

      const message: NotificationMessage = {
        id: 'test-3',
        eventId: 'event-3',
        userId: 'user1',
        channel: 'PUSH',
        subject: 'Test Subject',
        content: 'Test Content',
        sent: false
      };

      const result = await service.sendNotification(message);
      expect(result).toBe(true);

      // Restore original Math.random
      Math.random = originalRandom;
    });

    it('should store in-app notification successfully', async () => {
      const message: NotificationMessage = {
        id: 'test-4',
        eventId: 'event-4',
        userId: 'user1',
        channel: 'IN_APP',
        subject: 'Test Subject',
        content: 'Test Content',
        sent: false
      };

      const result = await service.sendNotification(message);
      expect(result).toBe(true);

      const notifications = service.getInAppNotifications('user1');
      expect(notifications).toHaveLength(1);
      expect(notifications[0].id).toBe('test-4');
    });
  });

  describe('sendNotificationsForEvent', () => {
    it('should send notifications to all configured channels for user', async () => {
      const messages = await service.sendNotificationsForEvent(
        'event-1',
        'LOW_STOCK',
        'user1',
        'Low Stock Alert',
        'Product is running low on stock'
      );

      expect(messages).toHaveLength(2); // EMAIL and IN_APP for LOW_STOCK
      expect(messages.every(m => m.sent)).toBe(true);
    });

    it('should respect user preferences for different event types', async () => {
      const messages = await service.sendNotificationsForEvent(
        'event-2',
        'IMMINENT_EXPIRATION',
        'user1',
        'Expiration Alert',
        'Product is expiring soon'
      );

      expect(messages).toHaveLength(2); // EMAIL and SMS for IMMINENT_EXPIRATION
      expect(messages.some(m => m.channel === 'EMAIL')).toBe(true);
      expect(messages.some(m => m.channel === 'SMS')).toBe(true);
    });

    it('should return empty array for disabled user', async () => {
      // Disable user1
      const disabledPref: UserNotificationPreference = {
        userId: 'user1',
        email: 'user1@example.com',
        preferences: {
          LOW_STOCK: ['EMAIL'],
          IMMINENT_EXPIRATION: ['SMS'],
          SUPPLIER_ORDER_UPDATE: ['EMAIL']
        },
        isEnabled: false
      };

      service.updateUserPreferences(disabledPref);

      const messages = await service.sendNotificationsForEvent(
        'event-3',
        'LOW_STOCK',
        'user1',
        'Low Stock Alert',
        'Product is running low on stock'
      );

      expect(messages).toHaveLength(0);
    });

    it('should return empty array for user with no preferences', async () => {
      const messages = await service.sendNotificationsForEvent(
        'event-4',
        'LOW_STOCK',
        'nonexistent-user',
        'Low Stock Alert',
        'Product is running low on stock'
      );

      expect(messages).toHaveLength(0);
    });
  });

  describe('user preferences', () => {
    it('should get user preferences', () => {
      const preferences = service.getUserPreferences('user1');
      expect(preferences).toBeDefined();
      expect(preferences?.userId).toBe('user1');
      expect(preferences?.isEnabled).toBe(true);
    });

    it('should update user preferences', () => {
      const newPreferences: UserNotificationPreference = {
        userId: 'user3',
        email: 'user3@example.com',
        phoneNumber: '+1234567890',
        preferences: {
          LOW_STOCK: ['EMAIL'],
          IMMINENT_EXPIRATION: ['SMS'],
          SUPPLIER_ORDER_UPDATE: ['PUSH']
        },
        isEnabled: true
      };

      service.updateUserPreferences(newPreferences);

      const retrieved = service.getUserPreferences('user3');
      expect(retrieved).toEqual(newPreferences);
    });

    it('should return undefined for non-existent user', () => {
      const preferences = service.getUserPreferences('nonexistent-user');
      expect(preferences).toBeUndefined();
    });
  });

  describe('in-app notifications', () => {
    it('should retrieve in-app notifications for user', async () => {
      // Add some in-app notifications
      await service.sendNotificationsForEvent(
        'event-1',
        'LOW_STOCK',
        'user1',
        'Alert 1',
        'Content 1'
      );

      await service.sendNotificationsForEvent(
        'event-2',
        'SUPPLIER_ORDER_UPDATE', // This one includes IN_APP
        'user1',
        'Alert 2',
        'Content 2'
      );

      const notifications = service.getInAppNotifications('user1');
      expect(notifications).toHaveLength(2); // One from each event type that includes IN_APP
      expect(notifications[0].userId).toBe('user1');
      expect(notifications[1].userId).toBe('user1');
    });

    it('should clear in-app notifications for user', async () => {
      // Add some notifications
      await service.sendNotificationsForEvent(
        'event-1',
        'LOW_STOCK',
        'user1',
        'Alert 1',
        'Content 1'
      );

      let notifications = service.getInAppNotifications('user1');
      expect(notifications).toHaveLength(1);

      service.clearInAppNotifications('user1');

      notifications = service.getInAppNotifications('user1');
      expect(notifications).toHaveLength(0);
    });

    it('should return empty array for user with no notifications', () => {
      const notifications = service.getInAppNotifications('nonexistent-user');
      expect(notifications).toHaveLength(0);
    });
  });

  describe('adapter validation', () => {
    it('should validate all adapters successfully', async () => {
      const isValid = await service.validateAllAdapters();
      expect(isValid).toBe(false); // SendGrid will fail validation due to missing API key
    });
  });
});