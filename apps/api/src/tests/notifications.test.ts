import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import notificationService, {
  EmailNotificationProvider,
  SMSNotificationProvider,
  PushNotificationProvider,
  InAppNotificationProvider
} from '../services/notifications.js';
import { AlertEventType, AlertSeverity, NotificationChannelType } from '@shared/types';

// Mock the database module
vi.mock('../database/connection.js', () => ({
  default: {
    query: vi.fn()
  }
}));

describe('NotificationService', () => {
  const mockDb = await import('../database/connection.js');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Notification Providers', () => {
    describe('EmailNotificationProvider', () => {
      it('should send email successfully', async () => {
        const provider = new EmailNotificationProvider();
        const mockUser = { email: 'test@example.com', name: 'Test User' };
        const mockAlert = {
          title: 'Test Alert',
          message: 'Test message',
          type: AlertEventType.LOW_STOCK,
          severity: AlertSeverity.MEDIUM
        };

        // Mock successful email sending
        vi.spyOn(Math, 'random').mockReturnValue(0.9);

        const result = await provider.send({} as any, mockAlert as any, mockUser);

        expect(result).toBe(true);
      });

      it('should handle email sending failure', async () => {
        const provider = new EmailNotificationProvider();
        const mockUser = { email: 'test@example.com', name: 'Test User' };
        const mockAlert = {
          title: 'Test Alert',
          message: 'Test message',
          type: AlertEventType.LOW_STOCK,
          severity: AlertSeverity.MEDIUM
        };

        // Mock email sending failure
        vi.spyOn(Math, 'random').mockReturnValue(0.04);

        const result = await provider.send({} as any, mockAlert as any, mockUser);

        expect(result).toBe(false);
      });
    });

    describe('SMSNotificationProvider', () => {
      it('should send SMS successfully', async () => {
        const provider = new SMSNotificationProvider();
        const mockUser = { phone: '+1234567890', name: 'Test User' };
        const mockAlert = {
          title: 'Test Alert',
          message: 'Test message',
          type: AlertEventType.LOW_STOCK,
          severity: AlertSeverity.MEDIUM
        };

        vi.spyOn(Math, 'random').mockReturnValue(0.9);

        const result = await provider.send({} as any, mockAlert as any, mockUser);

        expect(result).toBe(true);
      });
    });

    describe('PushNotificationProvider', () => {
      it('should send push notification successfully', async () => {
        const provider = new PushNotificationProvider();
        const mockUser = { id: 'user-1', name: 'Test User' };
        const mockAlert = {
          title: 'Test Alert',
          message: 'Test message',
          type: AlertEventType.LOW_STOCK,
          severity: AlertSeverity.MEDIUM
        };

        vi.spyOn(Math, 'random').mockReturnValue(0.9);

        const result = await provider.send({} as any, mockAlert as any, mockUser);

        expect(result).toBe(true);
      });
    });

    describe('InAppNotificationProvider', () => {
      it('should create in-app notification successfully', async () => {
        const provider = new InAppNotificationProvider();
        const mockUser = { id: 'user-1', name: 'Test User' };
        const mockAlert = {
          title: 'Test Alert',
          message: 'Test message',
          type: AlertEventType.LOW_STOCK,
          severity: AlertSeverity.MEDIUM
        };

        const mockDbQuery = vi.mocked(mockDb.default.query);
        mockDbQuery.mockResolvedValue({ rows: [] });

        const result = await provider.send({} as any, mockAlert as any, mockUser);

        expect(result).toBe(true);
        expect(mockDbQuery).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO in_app_notifications'),
          expect.arrayContaining([
            expect.any(String), // id
            mockUser.id,
            mockAlert.title,
            mockAlert.message,
            mockAlert.severity,
            false,
            expect.any(Date)
          ])
        );
      });
    });
  });

  describe('Alert Event Management', () => {
    it('should create alert event successfully', async () => {
      const mockDbQuery = vi.mocked(mockDb.default.query);
      mockDbQuery.mockResolvedValue({ rows: [] });

      const alertData = {
        type: AlertEventType.LOW_STOCK,
        severity: AlertSeverity.MEDIUM,
        title: 'Low Stock Alert',
        message: 'Product is running low',
        data: { productId: 'product-1', currentQuantity: 5 },
        locationId: 'location-1',
        productId: 'product-1'
      };

      const result = await notificationService.createAlertEvent(alertData);

      expect(result).toMatchObject({
        id: expect.any(String),
        ...alertData,
        createdAt: expect.any(Date)
      });

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO alert_events'),
        expect.arrayContaining([
          result.id,
          alertData.type,
          alertData.severity,
          alertData.title,
          alertData.message,
          expect.stringContaining('"productId":"product-1"'),
          alertData.locationId,
          alertData.productId,
          expect.any(Date)
        ])
      );
    });
  });

  describe('User Preference Logic', () => {
    it('should meet severity threshold correctly', () => {
      // Access private method through prototype for testing
      const meetsThreshold = (notificationService as any).meetsSeverityThreshold;

      expect(meetsThreshold(AlertSeverity.HIGH, AlertSeverity.MEDIUM)).toBe(true);
      expect(meetsThreshold(AlertSeverity.MEDIUM, AlertSeverity.HIGH)).toBe(false);
      expect(meetsThreshold(AlertSeverity.CRITICAL, AlertSeverity.LOW)).toBe(true);
      expect(meetsThreshold(AlertSeverity.LOW, AlertSeverity.LOW)).toBe(true);
    });

    it('should check quiet hours correctly', () => {
      const isInQuietHours = (notificationService as any).isInQuietHours;

      // Test normal hours
      expect(isInQuietHours(null)).toBe(false);
      
      // Test same day quiet hours (22:00 - 06:00)
      const eveningQuietHours = { start: '22:00', end: '06:00' };
      
      // Mock current time to 23:00
      const date = new Date();
      date.setHours(23, 0, 0, 0);
      vi.spyOn(global, 'Date').mockImplementation(() => date as any);
      
      expect(isInQuietHours(eveningQuietHours)).toBe(true);
      
      // Mock current time to 10:00
      date.setHours(10, 0, 0, 0);
      expect(isInQuietHours(eveningQuietHours)).toBe(false);
    });

    it('should get default preferences based on role', () => {
      const getDefaultPreferences = (notificationService as any).getDefaultPreferences;

      const staffPrefs = getDefaultPreferences('staff');
      expect(staffPrefs.alertTypes).toContain(AlertEventType.LOW_STOCK);
      expect(staffPrefs.minSeverity).toBe(AlertSeverity.MEDIUM);

      const adminPrefs = getDefaultPreferences('admin');
      expect(adminPrefs.alertTypes).toEqual(Object.values(AlertEventType));
      expect(adminPrefs.minSeverity).toBe(AlertSeverity.LOW);
      expect(adminPrefs.channels).toHaveLength(4); // All channels
    });
  });

  describe('In-App Notifications', () => {
    it('should get in-app notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          user_id: 'user-1',
          title: 'Test Alert',
          message: 'Test message',
          severity: 'medium',
          read: false,
          created_at: new Date()
        }
      ];

      const mockDbQuery = vi.mocked(mockDb.default.query);
      mockDbQuery.mockResolvedValue({ rows: mockNotifications });

      const result = await notificationService.getInAppNotifications('user-1', false);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'notif-1',
        userId: 'user-1',
        title: 'Test Alert',
        message: 'Test message',
        severity: AlertSeverity.MEDIUM,
        read: false
      });

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM in_app_notifications'),
        ['user-1']
      );
    });

    it('should get only unread notifications', async () => {
      const mockDbQuery = vi.mocked(mockDb.default.query);
      mockDbQuery.mockResolvedValue({ rows: [] });

      await notificationService.getInAppNotifications('user-1', true);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND read = false'),
        ['user-1']
      );
    });

    it('should mark notification as read', async () => {
      const mockDbQuery = vi.mocked(mockDb.default.query);
      mockDbQuery.mockResolvedValue({ rowCount: 1 });

      const result = await notificationService.markNotificationAsRead('notif-1', 'user-1');

      expect(result).toBe(true);
      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE in_app_notifications'),
        expect.arrayContaining([expect.any(Date), 'notif-1', 'user-1'])
      );
    });

    it('should mark all notifications as read', async () => {
      const mockDbQuery = vi.mocked(mockDb.default.query);
      mockDbQuery.mockResolvedValue({ rowCount: 5 });

      const result = await notificationService.markAllNotificationsAsRead('user-1');

      expect(result).toBe(5);
      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE in_app_notifications'),
        expect.arrayContaining([expect.any(Date), 'user-1'])
      );
    });
  });

  describe('Notification Queue Processing', () => {
    it('should process notification queue', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          user_id: 'user-1',
          alert_event_id: 'alert-1',
          channel_type: 'email',
          status: 'pending',
          retry_count: 0,
          type: 'low_stock',
          severity: 'medium',
          title: 'Test Alert',
          message: 'Test message',
          data: {},
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          phone: '+1234567890'
        }
      ];

      const mockDbQuery = vi.mocked(mockDb.default.query);
      mockDbQuery
        .mockResolvedValueOnce({ rows: mockNotifications }) // Fetch pending notifications
        .mockResolvedValueOnce({ rowCount: 1 }); // Update to sent

      // Mock successful email sending
      vi.spyOn(Math, 'random').mockReturnValue(0.9);

      await notificationService.processNotificationQueue();

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT n.*, ae.*, u.email'),
        []
      );
    });

    it('should handle notification processing failure', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          user_id: 'user-1',
          alert_event_id: 'alert-1',
          channel_type: 'email',
          status: 'pending',
          retry_count: 0,
          type: 'low_stock',
          severity: 'medium',
          title: 'Test Alert',
          message: 'Test message',
          data: {},
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          phone: '+1234567890'
        }
      ];

      const mockDbQuery = vi.mocked(mockDb.default.query);
      mockDbQuery
        .mockResolvedValueOnce({ rows: mockNotifications }) // Fetch pending notifications
        .mockResolvedValueOnce({ rowCount: 1 }); // Update to failed

      // Mock failed email sending
      vi.spyOn(Math, 'random').mockReturnValue(0.04);

      await notificationService.processNotificationQueue();

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notifications'),
        expect.arrayContaining([
          expect.stringContaining('Mock email service failure'),
          1, // retry count
          'notif-1'
        ])
      );
    });
  });
});