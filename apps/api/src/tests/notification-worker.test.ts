import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationWorker } from '@shared/utils';
import { NotificationEvent, UserNotificationPreferences } from '@shared/types';

describe('NotificationWorker', () => {
  let worker: NotificationWorker;

  beforeEach(() => {
    worker = new NotificationWorker();
  });

  describe('Worker Lifecycle', () => {
    it('should start and stop the worker', () => {
      expect(worker['isRunning']).toBe(false);
      
      worker.start();
      expect(worker['isRunning']).toBe(true);
      
      worker.stop();
      expect(worker['isRunning']).toBe(false);
    });

    it('should not start if already running', () => {
      worker.start();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      worker.start(); // Try to start again
      expect(consoleSpy).toHaveBeenCalledWith('Notification worker is already running');
      
      consoleSpy.mockRestore();
      worker.stop();
    });
  });

  describe('Event Processing', () => {
    beforeEach(() => {
      worker.start();
      
      // Set up test user preferences
      const preferences: UserNotificationPreferences = {
        userId: 'test-user',
        channels: [
          { type: 'email', enabled: true },
          { type: 'in_app', enabled: true }
        ],
        eventTypes: ['low_stock', 'impending_expiration'],
        minPriority: 'low'
      };
      
      worker.getNotificationService().setUserPreferences(preferences);
    });

    afterEach(() => {
      worker.stop();
    });

    it('should add event to processing queue', async () => {
      const event: NotificationEvent = {
        id: 'test-event-1',
        type: 'low_stock',
        userId: 'test-user',
        data: {
          itemName: 'Test Product',
          currentStock: 3
        },
        timestamp: new Date(),
        priority: 'high'
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await worker.addEvent(event);
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(consoleSpy).toHaveBeenCalledWith('Event test-event-1 added to processing queue');
      
      consoleSpy.mockRestore();
    });

    it('should handle events without user preferences gracefully', async () => {
      const event: NotificationEvent = {
        id: 'test-event-2',
        type: 'low_stock',
        userId: 'unknown-user',
        data: {
          itemName: 'Test Product',
          currentStock: 3
        },
        timestamp: new Date(),
        priority: 'high'
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await worker.addEvent(event);
      
      expect(consoleSpy).toHaveBeenCalledWith('No preferences found for user unknown-user, skipping notification');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Adapter Registration', () => {
    it('should have all required adapters registered', () => {
      const notificationService = worker.getNotificationService();
      const adapters = notificationService['adapters'];
      
      expect(adapters.has('email')).toBe(true);
      expect(adapters.has('sms')).toBe(true);
      expect(adapters.has('push')).toBe(true);
      expect(adapters.has('in_app')).toBe(true);
    });
  });
});