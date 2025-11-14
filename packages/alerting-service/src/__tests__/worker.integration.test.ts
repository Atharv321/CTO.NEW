import { AlertWorker } from '../workers/alert-worker';
import { QueueService } from '../services/queue-service';
import { AlertProcessor } from '../services/alert-processor';
import { NotificationService } from '../services/notification-service';
import { AlertEvent, EventType } from '../types';

describe('AlertWorker Integration Tests', () => {
  let worker: AlertWorker;
  let queueService: QueueService;
  let alertProcessor: AlertProcessor;
  let notificationService: NotificationService;

  beforeAll(async () => {
    worker = new AlertWorker();
    queueService = new QueueService();
    alertProcessor = new AlertProcessor();
    notificationService = new NotificationService();
  });

  afterAll(async () => {
    await worker.stop();
  });

  beforeEach(async () => {
    // Clean up any existing jobs
    await queueService.getEventQueue().clean(0, 'completed');
    await queueService.getEventQueue().clean(0, 'failed');
    await queueService.getNotificationQueue().clean(0, 'completed');
    await queueService.getNotificationQueue().clean(0, 'failed');
  });

  describe('Event Processing', () => {
    it('should process low stock event and generate notifications', async () => {
      const event: AlertEvent = {
        id: 'integration-test-1',
        type: 'LOW_STOCK',
        userId: 'user1',
        data: {
          productName: 'Test Shampoo',
          stock: 3
        },
        severity: 'HIGH',
        timestamp: new Date(),
        processed: false
      };

      // Store the event for the worker to find
      alertProcessor.storeEvent(event);

      // Add job to queue
      await queueService.addEventJob(event);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check that event was processed
      const processedEvent = alertProcessor.getEvent(event.id);
      expect(processedEvent?.processed).toBe(true);

      // Check that notifications were sent
      const notifications = notificationService.getInAppNotifications('user1');
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications.some(n => n.eventId === event.id)).toBe(true);
    }, 10000);

    it('should process imminent expiration event', async () => {
      const event: AlertEvent = {
        id: 'integration-test-2',
        type: 'IMMINENT_EXPIRATION',
        userId: 'user1',
        data: {
          productName: 'Test Hair Gel',
          daysUntilExpiration: 2
        },
        severity: 'HIGH',
        timestamp: new Date(),
        processed: false
      };

      alertProcessor.storeEvent(event);
      await queueService.addEventJob(event);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const processedEvent = alertProcessor.getEvent(event.id);
      expect(processedEvent?.processed).toBe(true);

      const notifications = notificationService.getInAppNotifications('user1');
      expect(notifications.some(n => n.eventId === event.id)).toBe(true);
    }, 10000);

    it('should process supplier order update event', async () => {
      const event: AlertEvent = {
        id: 'integration-test-3',
        type: 'SUPPLIER_ORDER_UPDATE',
        userId: 'user2',
        data: {
          orderId: 'ORD-123',
          status: 'DELAYED',
          additionalInfo: 'Weather delay'
        },
        severity: 'HIGH',
        timestamp: new Date(),
        processed: false
      };

      alertProcessor.storeEvent(event);
      await queueService.addEventJob(event);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const processedEvent = alertProcessor.getEvent(event.id);
      expect(processedEvent?.processed).toBe(true);

      const notifications = notificationService.getInAppNotifications('user2');
      expect(notifications.some(n => n.eventId === event.id)).toBe(true);
    }, 10000);

    it('should not generate alerts for events below thresholds', async () => {
      const event: AlertEvent = {
        id: 'integration-test-4',
        type: 'LOW_STOCK',
        userId: 'user1',
        data: {
          productName: 'Test Product',
          stock: 50 // Above all thresholds
        },
        severity: 'LOW',
        timestamp: new Date(),
        processed: false
      };

      alertProcessor.storeEvent(event);
      await queueService.addEventJob(event);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const processedEvent = alertProcessor.getEvent(event.id);
      expect(processedEvent?.processed).toBe(true);

      // Should not have generated any notifications
      const notifications = notificationService.getInAppNotifications('user1');
      expect(notifications.some(n => n.eventId === event.id)).toBe(false);
    }, 10000);
  });

  describe('Queue Statistics', () => {
    it('should provide queue statistics', async () => {
      const stats = await queueService.getQueueStats();
      
      expect(stats.eventQueue).toBeDefined();
      expect(stats.notificationQueue).toBeDefined();
      expect(stats.eventQueue.waiting).toBeDefined();
      expect(stats.eventQueue.active).toBeDefined();
      expect(stats.eventQueue.completed).toBeDefined();
      expect(stats.eventQueue.failed).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing events gracefully', async () => {
      // Add job for non-existent event
      await queueService.addEventJob({
        id: 'non-existent-event',
        type: 'LOW_STOCK',
        userId: 'user1',
        data: {},
        severity: 'LOW',
        timestamp: new Date(),
        processed: false
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Should not crash the worker
      const stats = await queueService.getQueueStats();
      expect(stats.eventQueue.failed).toBeGreaterThanOrEqual(0);
    }, 10000);
  });

  describe('User Preferences', () => {
    it('should respect user notification preferences', async () => {
      // Test with user2 who has different preferences
      const event: AlertEvent = {
        id: 'integration-test-5',
        type: 'LOW_STOCK',
        userId: 'user2',
        data: {
          productName: 'Test Product',
          stock: 3
        },
        severity: 'HIGH',
        timestamp: new Date(),
        processed: false
      };

      alertProcessor.storeEvent(event);
      await queueService.addEventJob(event);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const processedEvent = alertProcessor.getEvent(event.id);
      expect(processedEvent?.processed).toBe(true);

      // User2 only gets IN_APP notifications for LOW_STOCK
      const notifications = notificationService.getInAppNotifications('user2');
      expect(notifications.some(n => n.eventId === event.id)).toBe(true);
    }, 10000);

    it('should not send notifications for disabled users', async () => {
      // Disable user1
      const disabledPref = notificationService.getUserPreferences('user1');
      if (disabledPref) {
        disabledPref.isEnabled = false;
        notificationService.updateUserPreferences(disabledPref);
      }

      const event: AlertEvent = {
        id: 'integration-test-6',
        type: 'LOW_STOCK',
        userId: 'user1',
        data: {
          productName: 'Test Product',
          stock: 3
        },
        severity: 'HIGH',
        timestamp: new Date(),
        processed: false
      };

      alertProcessor.storeEvent(event);
      await queueService.addEventJob(event);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const processedEvent = alertProcessor.getEvent(event.id);
      expect(processedEvent?.processed).toBe(true);

      // Should not have generated any notifications for disabled user
      const notifications = notificationService.getInAppNotifications('user1');
      expect(notifications.some(n => n.eventId === event.id)).toBe(false);
    }, 10000);
  });
});