import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../index.js';

// Mock console to avoid noise in tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('Alerting Service Integration', () => {
  it('should have all required alerting endpoints available', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.body.endpoints).toHaveProperty('alerts');
    expect(response.body.endpoints.alerts).toBe('/api/alerts');
  });

  it('should validate alerting service health', async () => {
    // Test that the main service starts correctly
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body.uptime).toBeGreaterThan(0);
  });

  it('should have alerting routes properly configured', async () => {
    // Test that alerting routes are registered
    const endpoints = [
      '/api/alerts/notifications',
      '/api/alerts/thresholds',
      '/api/alerts/history',
      '/api/alerts/preferences'
    ];

    for (const endpoint of endpoints) {
      const response = await request(app)
        .get(endpoint)
        .set('x-user-id', 'test-user')
        .expect(200); // Should return 200 even if no data, but route exists

      expect(response.body).toBeDefined();
    }
  });
});

describe('Alerting Core Functionality', () => {
  it('should demonstrate notification provider pattern', async () => {
    const { EmailNotificationProvider } = await import('../services/notifications.js');
    
    const provider = new EmailNotificationProvider();
    const mockUser = { email: 'test@example.com', name: 'Test User' };
    const mockAlert = {
      title: 'Test Alert',
      message: 'Test message',
      type: 'low_stock',
      severity: 'medium'
    };

    // Mock Math.random for consistent testing
    vi.spyOn(Math, 'random').mockReturnValue(0.9); // Will succeed

    const result = await provider.send({} as any, mockAlert as any, mockUser);
    expect(result).toBe(true);

    vi.restoreAllMocks();
  });

  it('should demonstrate alerting worker service structure', async () => {
    const alertingService = await import('../services/alerting.js');
    const defaultExport = alertingService.default;
    
    expect(defaultExport).toBeDefined();
    expect(typeof defaultExport.start).toBe('function');
    expect(typeof defaultExport.stop).toBe('function');
    expect(typeof defaultExport.createAlertThreshold).toBe('function');
    expect(typeof defaultExport.checkLowStockAlerts).toBe('function');
  });

  it('should demonstrate notification service structure', async () => {
    const notificationService = await import('../services/notifications.js');
    const defaultExport = notificationService.default;
    
    expect(defaultExport).toBeDefined();
    expect(typeof defaultExport.getInAppNotifications).toBe('function');
    expect(typeof defaultExport.markNotificationAsRead).toBe('function');
    expect(typeof defaultExport.processNotificationQueue).toBe('function');
    expect(typeof defaultExport.createAlertEvent).toBe('function');
  });
});

describe('Database Schema Validation', () => {
  it('should have all required alerting tables in migrations', async () => {
    const { default: db } = await import('../database/connection.js');
    
    // Check if tables exist by querying their structure
    const requiredTables = [
      'alert_events',
      'alert_thresholds', 
      'user_notification_preferences',
      'notifications',
      'in_app_notifications'
    ];

    for (const table of requiredTables) {
      try {
        await db.query(`SELECT 1 FROM ${table} LIMIT 1`);
        // If we get here, table exists (even if empty)
      } catch (error) {
        // Table doesn't exist or other error
        throw new Error(`Required table ${table} is missing`);
      }
    }
  });
});

describe('Type System Validation', () => {
  it('should have all required alerting types defined', async () => {
    const { 
      AlertEvent, 
      AlertEventType, 
      AlertSeverity,
      NotificationChannel,
      NotificationChannelType,
      UserNotificationPreference,
      Notification,
      NotificationStatus,
      InAppNotification,
      AlertThreshold
    } = await import('@shared/types');

    expect(AlertEvent).toBeDefined();
    expect(AlertEventType).toBeDefined();
    expect(AlertSeverity).toBeDefined();
    expect(NotificationChannel).toBeDefined();
    expect(NotificationChannelType).toBeDefined();
    expect(UserNotificationPreference).toBeDefined();
    expect(Notification).toBeDefined();
    expect(NotificationStatus).toBeDefined();
    expect(InAppNotification).toBeDefined();
    expect(AlertThreshold).toBeDefined();

    // Check enum values
    expect(Object.values(AlertEventType)).toContain('low_stock');
    expect(Object.values(AlertEventType)).toContain('impending_expiration');
    expect(Object.values(AlertEventType)).toContain('supplier_order_update');
    expect(Object.values(AlertEventType)).toContain('system_error');

    expect(Object.values(AlertSeverity)).toContain('low');
    expect(Object.values(AlertSeverity)).toContain('medium');
    expect(Object.values(AlertSeverity)).toContain('high');
    expect(Object.values(AlertSeverity)).toContain('critical');

    expect(Object.values(NotificationChannelType)).toContain('email');
    expect(Object.values(NotificationChannelType)).toContain('sms');
    expect(Object.values(NotificationChannelType)).toContain('push');
    expect(Object.values(NotificationChannelType)).toContain('in_app');

    expect(Object.values(NotificationStatus)).toContain('pending');
    expect(Object.values(NotificationStatus)).toContain('sent');
    expect(Object.values(NotificationStatus)).toContain('failed');
    expect(Object.values(NotificationStatus)).toContain('retrying');
  });
});