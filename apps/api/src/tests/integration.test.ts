import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getNotificationWorker } from '@shared/utils';
import { NotificationEvent, UserNotificationPreferences } from '@shared/types';

describe('Alerting Service Integration Tests', () => {
  let worker: any;

  beforeEach(() => {
    worker = getNotificationWorker();
    worker.start();
  });

  afterEach(() => {
    worker.stop();
  });

  describe('Complete Notification Flow', () => {
    it('should process low stock alert through all enabled channels', async () => {
      // Set up user preferences with all channels enabled
      const preferences: UserNotificationPreferences = {
        userId: 'integration-user',
        channels: [
          { type: 'email', enabled: true },
          { type: 'sms', enabled: true },
          { type: 'push', enabled: true },
          { type: 'in_app', enabled: true }
        ],
        eventTypes: ['low_stock'],
        minPriority: 'low'
      };

      worker.getNotificationService().setUserPreferences(preferences);

      // Create low stock event
      const event: NotificationEvent = {
        id: 'integration-event-1',
        type: 'low_stock',
        userId: 'integration-user',
        data: {
          itemName: 'Integration Test Product',
          currentStock: 2,
          reorderLevel: 10
        },
        timestamp: new Date(),
        priority: 'high'
      };

      // Process the event
      await worker.addEvent(event);

      // Wait for queue processing
      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify in-app notifications
      const inAppAdapter = worker.getNotificationService()['adapters'].get('in_app');
      const notifications = inAppAdapter.getNotifications('integration-user');

      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toBe('Low Stock Alert: Integration Test Product');
      expect(notifications[0].message).toContain('only 2 units remaining');
    });

    it('should respect user preferences and quiet hours', async () => {
      // Set up user preferences with quiet hours
      const preferences: UserNotificationPreferences = {
        userId: 'quiet-hours-user',
        channels: [
          { type: 'email', enabled: true },
          { type: 'in_app', enabled: true }
        ],
        eventTypes: ['impending_expiration'],
        minPriority: 'medium',
        quietHours: {
          start: '22:00',
          end: '06:00'
        }
      };

      worker.getNotificationService().setUserPreferences(preferences);

      // Create expiration event during quiet hours
      const event: NotificationEvent = {
        id: 'quiet-hours-event',
        type: 'impending_expiration',
        userId: 'quiet-hours-user',
        data: {
          itemName: 'Perishable Item',
          daysUntilExpiration: 1,
          expirationDate: '2024-12-20'
        },
        timestamp: new Date(),
        priority: 'high'
      };

      // Mock current time to be during quiet hours
      const originalDate = global.Date;
      const mockDate = new Date();
      mockDate.setHours(23, 30, 0, 0);
      global.Date = class extends Date {
        constructor(...args: any[]) {
          if (args.length === 0) {
            return mockDate;
          }
          return new originalDate(...args);
        }
        static now() {
          return mockDate.getTime();
        }
      } as any;

      try {
        // Process the event
        await worker.addEvent(event);

        // Wait for queue processing
        await new Promise(resolve => setTimeout(resolve, 200));

        // Verify no notifications were created due to quiet hours
        const inAppAdapter = worker.getNotificationService()['adapters'].get('in_app');
        const notifications = inAppAdapter.getNotifications('quiet-hours-user');

        expect(notifications).toHaveLength(0);
      } finally {
        global.Date = originalDate;
      }
    });

    it('should handle multiple events for different users', async () => {
      // Set up preferences for multiple users
      const user1Preferences: UserNotificationPreferences = {
        userId: 'user1',
        channels: [{ type: 'email', enabled: true }, { type: 'in_app', enabled: true }],
        eventTypes: ['low_stock'],
        minPriority: 'low'
      };

      const user2Preferences: UserNotificationPreferences = {
        userId: 'user2',
        channels: [{ type: 'email', enabled: true }, { type: 'in_app', enabled: true }],
        eventTypes: ['supplier_order_update'],
        minPriority: 'low'
      };

      worker.getNotificationService().setUserPreferences(user1Preferences);
      worker.getNotificationService().setUserPreferences(user2Preferences);

      // Create events for different users
      const event1: NotificationEvent = {
        id: 'multi-event-1',
        type: 'low_stock',
        userId: 'user1',
        data: { itemName: 'Product A', currentStock: 5 },
        timestamp: new Date(),
        priority: 'medium'
      };

      const event2: NotificationEvent = {
        id: 'multi-event-2',
        type: 'supplier_order_update',
        userId: 'user2',
        data: { orderNumber: 'ORD-123', status: 'delivered' },
        timestamp: new Date(),
        priority: 'low'
      };

      // Process both events
      await Promise.all([worker.addEvent(event1), worker.addEvent(event2)]);

      // Wait for queue processing
      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify notifications for each user
      const inAppAdapter = worker.getNotificationService()['adapters'].get('in_app');
      
      const user1Notifications = inAppAdapter.getNotifications('user1');
      const user2Notifications = inAppAdapter.getNotifications('user2');

      expect(user1Notifications).toHaveLength(1);
      expect(user1Notifications[0].title).toBe('Low Stock Alert: Product A');

      expect(user2Notifications).toHaveLength(1);
      expect(user2Notifications[0].title).toBe('Order Update: ORD-123');
    });

    it('should handle threshold-based alerts', async () => {
      const notificationService = worker.getNotificationService();

      // Test low stock thresholds
      const lowStockThresholds = notificationService.checkThresholds('low_stock', 3);
      expect(lowStockThresholds).toHaveLength(2);
      expect(lowStockThresholds[0].value).toBe(10);
      expect(lowStockThresholds[1].value).toBe(5);

      // Test expiration thresholds
      const expirationThresholds = notificationService.checkThresholds('impending_expiration', 2);
      expect(expirationThresholds).toHaveLength(2);
      expect(expirationThresholds[0].value).toBe(7);
      expect(expirationThresholds[1].value).toBe(3);

      // Test value above thresholds
      const noThresholds = notificationService.checkThresholds('low_stock', 15);
      expect(noThresholds).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle adapter failures gracefully', async () => {
      const preferences: UserNotificationPreferences = {
        userId: 'error-test-user',
        channels: [{ type: 'email', enabled: true }, { type: 'in_app', enabled: true }],
        eventTypes: ['low_stock'],
        minPriority: 'low'
      };

      worker.getNotificationService().setUserPreferences(preferences);

      // Create event that will cause email to fail (contains 'fail' in body)
      const event: NotificationEvent = {
        id: 'error-event',
        type: 'low_stock',
        userId: 'error-test-user',
        data: { itemName: 'fail-product', currentStock: 1 },
        timestamp: new Date(),
        priority: 'high'
      };

      await worker.addEvent(event);

      // Wait for queue processing
      await new Promise(resolve => setTimeout(resolve, 200));

      // In-app notification should still work even if email fails
      const inAppAdapter = worker.getNotificationService()['adapters'].get('in_app');
      const notifications = inAppAdapter.getNotifications('error-test-user');

      expect(notifications).toHaveLength(1);
    });
  });
});