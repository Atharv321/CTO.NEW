import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { getNotificationWorker } from '@shared/utils';
import alertsRouter from '../routes/alerts';

describe('Alerts API Routes', () => {
  let app: express.Application;
  let worker: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/alerts', alertsRouter);
    
    worker = getNotificationWorker();
    worker.start();
    
    // Set up test user preferences
    const preferences = {
      userId: 'test-user-123',
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

  describe('GET /api/alerts/notifications/:userId', () => {
    it('should return empty notifications for new user', async () => {
      const response = await request(app)
        .get('/api/alerts/notifications/new-user')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return notifications for user with existing notifications', async () => {
      // First, create a notification by adding an event
      await request(app)
        .post('/api/alerts/events')
        .send({
          type: 'low_stock',
          userId: 'test-user-123',
          data: {
            itemName: 'Test Item',
            currentStock: 5
          },
          priority: 'high'
        })
        .expect(200);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Then fetch notifications
      const response = await request(app)
        .get('/api/alerts/notifications/test-user-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('PUT /api/alerts/notifications/:userId/:notificationId/read', () => {
    it('should return 404 for non-existent notification', async () => {
      const response = await request(app)
        .put('/api/alerts/notifications/test-user-123/non-existent/read')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Notification not found');
    });
  });

  describe('POST /api/alerts/preferences/:userId', () => {
    it('should set user preferences', async () => {
      const preferences = {
        channels: [
          { type: 'email', enabled: true },
          { type: 'sms', enabled: false }
        ],
        eventTypes: ['low_stock'],
        minPriority: 'medium',
        quietHours: {
          start: '22:00',
          end: '06:00'
        }
      };

      const response = await request(app)
        .post('/api/alerts/preferences/new-user')
        .send(preferences)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe('new-user');
      expect(response.body.data.channels).toEqual(preferences.channels);
    });
  });

  describe('GET /api/alerts/preferences/:userId', () => {
    it('should return user preferences', async () => {
      const response = await request(app)
        .get('/api/alerts/preferences/test-user-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe('test-user-123');
    });

    it('should return 404 for non-existent preferences', async () => {
      const response = await request(app)
        .get('/api/alerts/preferences/non-existent-user')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Preferences not found');
    });
  });

  describe('POST /api/alerts/events', () => {
    it('should create and queue low stock event', async () => {
      const eventData = {
        type: 'low_stock',
        userId: 'test-user-123',
        data: {
          itemName: 'Test Product',
          currentStock: 3
        },
        priority: 'high'
      };

      const response = await request(app)
        .post('/api/alerts/events')
        .send(eventData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Event added to queue');
      expect(response.body.data.eventId).toBeDefined();
    });

    it('should create and queue impending expiration event', async () => {
      const eventData = {
        type: 'impending_expiration',
        userId: 'test-user-123',
        data: {
          itemName: 'Test Product',
          daysUntilExpiration: 2,
          expirationDate: '2024-12-25'
        },
        priority: 'medium'
      };

      const response = await request(app)
        .post('/api/alerts/events')
        .send(eventData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Event added to queue');
    });

    it('should create and queue supplier order update event', async () => {
      const eventData = {
        type: 'supplier_order_update',
        userId: 'test-user-123',
        data: {
          orderNumber: 'ORD-001',
          status: 'shipped'
        },
        priority: 'low'
      };

      const response = await request(app)
        .post('/api/alerts/events')
        .send(eventData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Event added to queue');
    });
  });
});