import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import db from '../database/connection.js';

// Mock the services to avoid actual database operations during tests
vi.mock('../services/notifications.js', () => ({
  default: {
    getInAppNotifications: vi.fn(),
    markNotificationAsRead: vi.fn(),
    markAllNotificationsAsRead: vi.fn(),
    processNotificationQueue: vi.fn(),
    createAlertEvent: vi.fn(),
    processAlertEvent: vi.fn()
  }
}));

vi.mock('../services/alerting.js', () => ({
  default: {
    getAlertThresholds: vi.fn(),
    createAlertThreshold: vi.fn(),
    updateAlertThreshold: vi.fn(),
    deleteAlertThreshold: vi.fn(),
    getAlertHistory: vi.fn(),
    createSupplierOrderAlert: vi.fn(),
    createSystemErrorAlert: vi.fn()
  }
}));

describe('Alerting API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/alerts/notifications', () => {
    it('should return in-app notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          userId: 'user-1',
          title: 'Low Stock Alert',
          message: 'Product X is running low',
          severity: 'medium',
          read: false,
          createdAt: new Date()
        }
      ];

      const { default: notificationService } = await import('../services/notifications.js');
      vi.mocked(notificationService.getInAppNotifications).mockResolvedValue(mockNotifications);

      const response = await request(app)
        .get('/api/alerts/notifications')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockNotifications);
      expect(notificationService.getInAppNotifications).toHaveBeenCalledWith('user-1', false);
    });

    it('should return unread notifications only when requested', async () => {
      const { default: notificationService } = await import('../services/notifications.js');
      vi.mocked(notificationService.getInAppNotifications).mockResolvedValue([]);

      await request(app)
        .get('/api/alerts/notifications?unreadOnly=true')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(notificationService.getInAppNotifications).toHaveBeenCalledWith('user-1', true);
    });

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/alerts/notifications?unreadOnly=invalid')
        .set('x-user-id', 'user-1')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('PUT /api/alerts/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const { default: notificationService } = await import('../services/notifications.js');
      vi.mocked(notificationService.markNotificationAsRead).mockResolvedValue(true);

      const response = await request(app)
        .put('/api/alerts/notif-1/read')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Notification marked as read');
      expect(notificationService.markNotificationAsRead).toHaveBeenCalledWith('notif-1', 'user-1');
    });

    it('should return 404 when notification not found', async () => {
      const { default: notificationService } = await import('../services/notifications.js');
      vi.mocked(notificationService.markNotificationAsRead).mockResolvedValue(false);

      const response = await request(app)
        .put('/api/alerts/notif-1/read')
        .set('x-user-id', 'user-1')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Notification not found');
    });

    it('should validate notification ID', async () => {
      const response = await request(app)
        .put('/api/alerts/invalid-id/read')
        .set('x-user-id', 'user-1')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('PUT /api/alerts/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const { default: notificationService } = await import('../services/notifications.js');
      vi.mocked(notificationService.markAllNotificationsAsRead).mockResolvedValue(5);

      const response = await request(app)
        .put('/api/alerts/notifications/read-all')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Marked 5 notifications as read');
      expect(notificationService.markAllNotificationsAsRead).toHaveBeenCalledWith('user-1');
    });
  });

  describe('GET /api/alerts/thresholds', () => {
    it('should return alert thresholds', async () => {
      const mockThresholds = [
        {
          id: 'threshold-1',
          locationId: 'location-1',
          productId: 'product-1',
          type: 'low_stock',
          threshold: 10,
          unit: 'units',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const { default: alertingService } = await import('../services/alerting.js');
      vi.mocked(alertingService.getAlertThresholds).mockResolvedValue(mockThresholds);

      const response = await request(app)
        .get('/api/alerts/thresholds')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockThresholds);
      expect(alertingService.getAlertThresholds).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should filter by location and product when provided', async () => {
      const { default: alertingService } = await import('../services/alerting.js');
      vi.mocked(alertingService.getAlertThresholds).mockResolvedValue([]);

      await request(app)
        .get('/api/alerts/thresholds?locationId=location-1&productId=product-1')
        .expect(200);

      expect(alertingService.getAlertThresholds).toHaveBeenCalledWith('location-1', 'product-1');
    });
  });

  describe('POST /api/alerts/thresholds', () => {
    it('should create alert threshold', async () => {
      const thresholdData = {
        type: 'low_stock',
        threshold: 15,
        unit: 'units',
        locationId: 'location-1',
        productId: 'product-1',
        isActive: true
      };

      const mockThreshold = {
        ...thresholdData,
        id: 'threshold-1',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { default: alertingService } = await import('../services/alerting.js');
      vi.mocked(alertingService.createAlertThreshold).mockResolvedValue(mockThreshold);

      const response = await request(app)
        .post('/api/alerts/thresholds')
        .send(thresholdData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockThreshold);
      expect(alertingService.createAlertThreshold).toHaveBeenCalledWith(thresholdData);
    });

    it('should validate threshold data', async () => {
      const invalidData = {
        type: 'invalid_type',
        threshold: 'not_a_number',
        unit: ''
      };

      const response = await request(app)
        .post('/api/alerts/thresholds')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('PUT /api/alerts/thresholds/:id', () => {
    it('should update alert threshold', async () => {
      const updateData = {
        threshold: 20,
        isActive: false
      };

      const { default: alertingService } = await import('../services/alerting.js');
      vi.mocked(alertingService.updateAlertThreshold).mockResolvedValue(true);

      const response = await request(app)
        .put('/api/alerts/thresholds/threshold-1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Alert threshold updated successfully');
      expect(alertingService.updateAlertThreshold).toHaveBeenCalledWith('threshold-1', updateData);
    });

    it('should return 404 when threshold not found', async () => {
      const { default: alertingService } = await import('../services/alerting.js');
      vi.mocked(alertingService.updateAlertThreshold).mockResolvedValue(false);

      const response = await request(app)
        .put('/api/alerts/thresholds/threshold-1')
        .send({ threshold: 20 })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Alert threshold not found');
    });
  });

  describe('DELETE /api/alerts/thresholds/:id', () => {
    it('should delete alert threshold', async () => {
      const { default: alertingService } = await import('../services/alerting.js');
      vi.mocked(alertingService.deleteAlertThreshold).mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/alerts/thresholds/threshold-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Alert threshold deleted successfully');
      expect(alertingService.deleteAlertThreshold).toHaveBeenCalledWith('threshold-1');
    });

    it('should return 404 when threshold not found', async () => {
      const { default: alertingService } = await import('../services/alerting.js');
      vi.mocked(alertingService.deleteAlertThreshold).mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/alerts/thresholds/threshold-1')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Alert threshold not found');
    });
  });

  describe('GET /api/alerts/history', () => {
    it('should return alert history', async () => {
      const mockHistory = [
        {
          id: 'alert-1',
          type: 'low_stock',
          severity: 'medium',
          title: 'Low Stock Alert',
          message: 'Product X is running low',
          createdAt: new Date()
        }
      ];

      const { default: alertingService } = await import('../services/alerting.js');
      vi.mocked(alertingService.getAlertHistory).mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/api/alerts/history')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockHistory);
      expect(response.body.pagination).toEqual({
        limit: 50,
        offset: 0,
        hasMore: false
      });
      expect(alertingService.getAlertHistory).toHaveBeenCalledWith(50, 0);
    });

    it('should use custom pagination parameters', async () => {
      const { default: alertingService } = await import('../services/alerting.js');
      vi.mocked(alertingService.getAlertHistory).mockResolvedValue([]);

      await request(app)
        .get('/api/alerts/history?limit=20&offset=10')
        .expect(200);

      expect(alertingService.getAlertHistory).toHaveBeenCalledWith(20, 10);
    });
  });

  describe('POST /api/alerts/test/supplier-order', () => {
    it('should create test supplier order alert', async () => {
      const orderData = {
        orderNumber: 'PO-12345',
        supplierName: 'Test Supplier',
        status: 'shipped',
        items: [
          { name: 'Product X', quantity: 100 }
        ],
        estimatedDelivery: '2024-12-01T00:00:00Z'
      };

      const { default: alertingService } = await import('../services/alerting.js');
      vi.mocked(alertingService.createSupplierOrderAlert).mockResolvedValue();

      const response = await request(app)
        .post('/api/alerts/test/supplier-order')
        .send(orderData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Test supplier order alert created');
      expect(alertingService.createSupplierOrderAlert).toHaveBeenCalledWith(orderData);
    });

    it('should validate order data', async () => {
      const invalidData = {
        orderNumber: '',
        supplierName: '',
        status: '',
        items: 'not_an_array'
      };

      const response = await request(app)
        .post('/api/alerts/test/supplier-order')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/alerts/test/system-error', () => {
    it('should create test system error alert', async () => {
      const errorData = {
        component: 'Database',
        message: 'Connection timeout',
        stackTrace: 'Error: Connection timeout\\n    at...'
      };

      const { default: alertingService } = await import('../services/alerting.js');
      vi.mocked(alertingService.createSystemErrorAlert).mockResolvedValue();

      const response = await request(app)
        .post('/api/alerts/test/system-error')
        .send(errorData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Test system error alert created');
      expect(alertingService.createSystemErrorAlert).toHaveBeenCalledWith(errorData);
    });
  });

  describe('POST /api/alerts/process-queue', () => {
    it('should process notification queue', async () => {
      const { default: notificationService } = await import('../services/notifications.js');
      vi.mocked(notificationService.processNotificationQueue).mockResolvedValue();

      const response = await request(app)
        .post('/api/alerts/process-queue')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Notification queue processed');
      expect(notificationService.processNotificationQueue).toHaveBeenCalled();
    });
  });

  describe('GET /api/alerts/preferences', () => {
    it('should return user notification preferences', async () => {
      const response = await request(app)
        .get('/api/alerts/preferences')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        userId: 'user-1',
        alertTypes: expect.any(Array),
        channels: expect.any(Array),
        minSeverity: expect.any(String),
        isActive: expect.any(Boolean)
      });
    });
  });

  describe('PUT /api/alerts/preferences', () => {
    it('should update user notification preferences', async () => {
      const preferencesData = {
        alertTypes: ['low_stock', 'impending_expiration'],
        channels: [
          { type: 'email', enabled: true, config: {} },
          { type: 'sms', enabled: false, config: {} }
        ],
        minSeverity: 'medium',
        quietHours: null,
        isActive: true
      };

      const response = await request(app)
        .put('/api/alerts/preferences')
        .set('x-user-id', 'user-1')
        .send(preferencesData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Notification preferences updated successfully');
    });

    it('should validate preferences data', async () => {
      const invalidData = {
        alertTypes: 'not_an_array',
        channels: 'not_an_array',
        minSeverity: 'invalid_severity'
      };

      const response = await request(app)
        .put('/api/alerts/preferences')
        .set('x-user-id', 'user-1')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });
});