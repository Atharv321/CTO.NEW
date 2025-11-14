import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from '@shared/utils';
import { SendGridAdapter, InAppAdapter } from '@shared/utils';
import { NotificationEvent, UserNotificationPreferences } from '@shared/types';

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockSendGridAdapter: SendGridAdapter;
  let mockInAppAdapter: InAppAdapter;

  beforeEach(() => {
    notificationService = new NotificationService();
    mockSendGridAdapter = new SendGridAdapter('test-key', 'test@example.com');
    mockInAppAdapter = new InAppAdapter();
    
    notificationService.registerAdapter('email', mockSendGridAdapter);
    notificationService.registerAdapter('in_app', mockInAppAdapter);
  });

  describe('User Preferences', () => {
    it('should set and get user preferences', () => {
      const preferences: UserNotificationPreferences = {
        userId: 'user123',
        channels: [
          { type: 'email', enabled: true },
          { type: 'sms', enabled: false },
          { type: 'push', enabled: true },
          { type: 'in_app', enabled: true }
        ],
        eventTypes: ['low_stock', 'impending_expiration'],
        minPriority: 'medium'
      };

      notificationService.setUserPreferences(preferences);
      const retrieved = notificationService.getUserPreferences('user123');

      expect(retrieved).toEqual(preferences);
    });

    it('should return undefined for non-existent user preferences', () => {
      const retrieved = notificationService.getUserPreferences('nonexistent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Event Processing', () => {
    beforeEach(() => {
      const preferences: UserNotificationPreferences = {
        userId: 'user123',
        channels: [
          { type: 'email', enabled: true },
          { type: 'in_app', enabled: true }
        ],
        eventTypes: ['low_stock', 'impending_expiration'],
        minPriority: 'low'
      };
      notificationService.setUserPreferences(preferences);
    });

    it('should process low stock event', async () => {
      const event: NotificationEvent = {
        id: 'event1',
        type: 'low_stock',
        userId: 'user123',
        data: {
          itemName: 'Test Item',
          currentStock: 5
        },
        timestamp: new Date(),
        priority: 'high'
      };

      await notificationService.processEvent(event);
      await notificationService.processQueue();

      const notifications = mockInAppAdapter.getNotifications('user123');
      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toBe('Low Stock Alert: Test Item');
      expect(notifications[0].message).toContain('only 5 units remaining');
    });

    it('should process impending expiration event', async () => {
      const event: NotificationEvent = {
        id: 'event2',
        type: 'impending_expiration',
        userId: 'user123',
        data: {
          itemName: 'Test Item',
          daysUntilExpiration: 3,
          expirationDate: '2024-12-25'
        },
        timestamp: new Date(),
        priority: 'medium'
      };

      await notificationService.processEvent(event);
      await notificationService.processQueue();

      const notifications = mockInAppAdapter.getNotifications('user123');
      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toBe('Expiration Alert: Test Item');
      expect(notifications[0].message).toContain('will expire in 3 days');
    });

    it('should process supplier order update event', async () => {
      const event: NotificationEvent = {
        id: 'event3',
        type: 'supplier_order_update',
        userId: 'user123',
        data: {
          orderNumber: 'ORD-001',
          status: 'shipped'
        },
        timestamp: new Date(),
        priority: 'low'
      };

      await notificationService.processEvent(event);
      await notificationService.processQueue();

      const notifications = mockInAppAdapter.getNotifications('user123');
      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toBe('Order Update: ORD-001');
      expect(notifications[0].message).toContain('shipped');
    });

    it('should respect event type preferences', async () => {
      const preferences: UserNotificationPreferences = {
        userId: 'user456',
        channels: [
          { type: 'email', enabled: true },
          { type: 'in_app', enabled: true }
        ],
        eventTypes: ['low_stock'], // Only low_stock events
        minPriority: 'low'
      };
      notificationService.setUserPreferences(preferences);

      const expirationEvent: NotificationEvent = {
        id: 'event4',
        type: 'impending_expiration',
        userId: 'user456',
        data: {
          itemName: 'Test Item',
          daysUntilExpiration: 3
        },
        timestamp: new Date(),
        priority: 'medium'
      };

      await notificationService.processEvent(expirationEvent);
      await notificationService.processQueue();

      const notifications = mockInAppAdapter.getNotifications('user456');
      expect(notifications).toHaveLength(0);
    });

    it('should respect priority preferences', async () => {
      const preferences: UserNotificationPreferences = {
        userId: 'user789',
        channels: [
          { type: 'email', enabled: true },
          { type: 'in_app', enabled: true }
        ],
        eventTypes: ['low_stock', 'impending_expiration'],
        minPriority: 'high' // Only high priority
      };
      notificationService.setUserPreferences(preferences);

      const lowPriorityEvent: NotificationEvent = {
        id: 'event5',
        type: 'low_stock',
        userId: 'user789',
        data: {
          itemName: 'Test Item',
          currentStock: 8
        },
        timestamp: new Date(),
        priority: 'low'
      };

      await notificationService.processEvent(lowPriorityEvent);
      await notificationService.processQueue();

      const notifications = mockInAppAdapter.getNotifications('user789');
      expect(notifications).toHaveLength(0);
    });

    it('should respect quiet hours', async () => {
      const preferences: UserNotificationPreferences = {
        userId: 'user999',
        channels: [
          { type: 'email', enabled: true },
          { type: 'in_app', enabled: true }
        ],
        eventTypes: ['low_stock'],
        minPriority: 'low',
        quietHours: {
          start: '22:00',
          end: '06:00'
        }
      };
      notificationService.setUserPreferences(preferences);

      const event: NotificationEvent = {
        id: 'event6',
        type: 'low_stock',
        userId: 'user999',
        data: {
          itemName: 'Test Item',
          currentStock: 5
        },
        timestamp: new Date(),
        priority: 'high'
      };

      // Mock current time to be during quiet hours
      const mockDate = new Date();
      mockDate.setHours(23, 0, 0, 0);
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate);

      await notificationService.processEvent(event);
      await notificationService.processQueue();

      const notifications = mockInAppAdapter.getNotifications('user999');
      expect(notifications).toHaveLength(0);

      vi.restoreAllMocks();
    });
  });

  describe('Threshold Checking', () => {
    it('should return appropriate thresholds for low stock', () => {
      const thresholds = notificationService.checkThresholds('low_stock', 3);
      expect(thresholds).toHaveLength(2);
      expect(thresholds[0].value).toBe(10);
      expect(thresholds[1].value).toBe(5);
    });

    it('should return empty array when value is above all thresholds', () => {
      const thresholds = notificationService.checkThresholds('low_stock', 15);
      expect(thresholds).toHaveLength(0);
    });

    it('should return appropriate thresholds for impending expiration', () => {
      const thresholds = notificationService.checkThresholds('impending_expiration', 2);
      expect(thresholds).toHaveLength(2);
      expect(thresholds[0].value).toBe(7);
      expect(thresholds[1].value).toBe(3);
    });
  });
});