import request from 'supertest';
import app from '../index';
import { AlertWorker } from '../workers/alert-worker';

describe('API Integration Tests', () => {
  let worker: AlertWorker;

  beforeAll(async () => {
    // Start a test worker instance
    worker = new AlertWorker();
    await worker.start();
  });

  afterAll(async () => {
    // Clean up
    await worker.stop();
  });

  describe('Health Endpoint', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('alerting-service');
    });
  });

  describe('Alert Endpoints', () => {
    it('should create a new alert event', async () => {
      const alertData = {
        type: 'LOW_STOCK',
        userId: 'test-user',
        data: {
          productName: 'Test Product',
          stock: 3
        },
        severity: 'HIGH'
      };

      const response = await request(app)
        .post('/api/v1/alerts')
        .send(alertData)
        .expect(201);

      expect(response.body.message).toContain('queued for processing');
      expect(response.body.eventId).toBeDefined();
    });

    it('should reject alert with missing required fields', async () => {
      const invalidAlert = {
        type: 'LOW_STOCK',
        // missing userId and data
      };

      await request(app)
        .post('/api/v1/alerts')
        .send(invalidAlert)
        .expect(400);
    });

    it('should reject alert with invalid event type', async () => {
      const invalidAlert = {
        type: 'INVALID_TYPE',
        userId: 'test-user',
        data: { stock: 3 }
      };

      await request(app)
        .post('/api/v1/alerts')
        .send(invalidAlert)
        .expect(400);
    });
  });

  describe('Notification Endpoints', () => {
    it('should get user preferences', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/preferences/user1')
        .expect(200);

      expect(response.body.userId).toBe('user1');
      expect(response.body.preferences).toBeDefined();
    });

    it('should return 404 for non-existent user preferences', async () => {
      await request(app)
        .get('/api/v1/notifications/preferences/nonexistent-user')
        .expect(404);
    });

    it('should update user preferences', async () => {
      const newPreferences = {
        email: 'updated@example.com',
        phoneNumber: '+1234567890',
        preferences: {
          LOW_STOCK: ['EMAIL'],
          IMMINENT_EXPIRATION: ['SMS'],
          SUPPLIER_ORDER_UPDATE: ['PUSH']
        },
        isEnabled: true
      };

      const response = await request(app)
        .put('/api/v1/notifications/preferences/test-user')
        .send(newPreferences)
        .expect(200);

      expect(response.body.message).toContain('updated successfully');
      expect(response.body.preferences.userId).toBe('test-user');
    });

    it('should get in-app notifications', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/in-app/user1')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should clear in-app notifications', async () => {
      const response = await request(app)
        .delete('/api/v1/notifications/in-app/user1')
        .expect(200);

      expect(response.body.message).toContain('cleared successfully');
    });

    it('should send test notification', async () => {
      const testNotification = {
        userId: 'test-user',
        channel: 'EMAIL',
        subject: 'Test Subject',
        content: 'Test Content'
      };

      const response = await request(app)
        .post('/api/v1/notifications/test')
        .send(testNotification)
        .expect(200);

      expect(response.body.message).toContain('sent successfully');
    });

    it('should reject test notification with missing fields', async () => {
      const invalidNotification = {
        userId: 'test-user',
        // missing channel, subject, content
      };

      await request(app)
        .post('/api/v1/notifications/test')
        .send(invalidNotification)
        .expect(400);
    });
  });

  describe('Queue Stats Endpoint', () => {
    it('should return queue statistics', async () => {
      const response = await request(app)
        .get('/api/v1/alerts/stats/queue')
        .expect(200);

      expect(response.body.eventQueue).toBeDefined();
      expect(response.body.notificationQueue).toBeDefined();
      expect(response.body.eventQueue.waiting).toBeDefined();
      expect(response.body.eventQueue.active).toBeDefined();
      expect(response.body.eventQueue.completed).toBeDefined();
      expect(response.body.eventQueue.failed).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      await request(app)
        .get('/api/v1/nonexistent')
        .expect(404);
    });

    it('should handle malformed JSON', async () => {
      await request(app)
        .post('/api/v1/alerts')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    it('should handle OPTIONS requests', async () => {
      await request(app)
        .options('/api/v1/alerts')
        .expect(200);
    });
  });
});