import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import alertingService from '../services/alerting.js';
import { AlertEventType, AlertSeverity } from '@shared/types';

// Mock the database module
vi.mock('../database/connection.js', () => ({
  default: {
    query: vi.fn()
  }
}));

// Mock the notification service
vi.mock('../services/notifications.js', () => ({
  default: {
    createAlertEvent: vi.fn(),
    processAlertEvent: vi.fn()
  }
}));

describe('AlertingWorkerService', () => {
  const mockDb = await import('../database/connection.js');
  const mockNotificationService = await import('../services/notifications.js');

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Service Lifecycle', () => {
    it('should start alerting worker', async () => {
      await alertingService.start();
      
      expect(alertingService['isRunning']).toBe(true);
      
      await alertingService.stop();
      expect(alertingService['isRunning']).toBe(false);
    });

    it('should not start if already running', async () => {
      await alertingService.start();
      
      const consoleSpy = vi.spyOn(console, 'log');
      await alertingService.start();
      
      expect(consoleSpy).toHaveBeenCalledWith('🚨 Alerting worker is already running');
      
      await alertingService.stop();
    });
  });

  describe('Alert Threshold Management', () => {
    it('should create alert threshold', async () => {
      const mockDbQuery = vi.mocked(mockDb.default.query);
      mockDbQuery.mockResolvedValue({ rows: [] });

      const thresholdData = {
        locationId: 'location-1',
        productId: 'product-1',
        type: AlertEventType.LOW_STOCK,
        threshold: 10,
        unit: 'units',
        isActive: true
      };

      const result = await alertingService.createAlertThreshold(thresholdData);

      expect(result).toMatchObject({
        id: expect.any(String),
        ...thresholdData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO alert_thresholds'),
        expect.arrayContaining([
          result.id,
          thresholdData.locationId,
          thresholdData.productId,
          thresholdData.type,
          thresholdData.threshold,
          thresholdData.unit,
          thresholdData.isActive,
          expect.any(Date),
          expect.any(Date)
        ])
      );
    });

    it('should handle duplicate threshold with upsert', async () => {
      const mockDbQuery = vi.mocked(mockDb.default.query);
      mockDbQuery.mockResolvedValue({ rows: [] });

      const thresholdData = {
        locationId: 'location-1',
        productId: 'product-1',
        type: AlertEventType.LOW_STOCK,
        threshold: 15,
        unit: 'units',
        isActive: true
      };

      await alertingService.createAlertThreshold(thresholdData);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT (location_id, product_id, type)'),
        expect.any(Array)
      );
    });

    it('should get alert thresholds', async () => {
      const mockThresholds = [
        {
          id: 'threshold-1',
          location_id: 'location-1',
          product_id: 'product-1',
          type: 'low_stock',
          threshold: '10.00',
          unit: 'units',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          product_name: 'Test Product',
          location_name: 'Test Location'
        }
      ];

      const mockDbQuery = vi.mocked(mockDb.default.query);
      mockDbQuery.mockResolvedValue({ rows: mockThresholds });

      const result = await alertingService.getAlertThresholds();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'threshold-1',
        locationId: 'location-1',
        productId: 'product-1',
        type: AlertEventType.LOW_STOCK,
        threshold: 10,
        unit: 'units',
        isActive: true
      });
    });

    it('should filter thresholds by location and product', async () => {
      const mockDbQuery = vi.mocked(mockDb.default.query);
      mockDbQuery.mockResolvedValue({ rows: [] });

      await alertingService.getAlertThresholds('location-1', 'product-1');

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE 1=1'),
        ['location-1', 'product-1']
      );
    });

    it('should update alert threshold', async () => {
      const mockDbQuery = vi.mocked(mockDb.default.query);
      mockDbQuery.mockResolvedValue({ rowCount: 1 });

      const updates = {
        threshold: 20,
        isActive: false
      };

      const result = await alertingService.updateAlertThreshold('threshold-1', updates);

      expect(result).toBe(true);
      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE alert_thresholds'),
        expect.arrayContaining([
          updates.threshold,
          updates.isActive,
          expect.any(Date),
          'threshold-1'
        ])
      );
    });

    it('should return false when updating non-existent threshold', async () => {
      const mockDbQuery = vi.mocked(mockDb.default.query);
      mockDbQuery.mockResolvedValue({ rowCount: 0 });

      const result = await alertingService.updateAlertThreshold('non-existent', { threshold: 20 });

      expect(result).toBe(false);
    });

    it('should delete alert threshold', async () => {
      const mockDbQuery = vi.mocked(mockDb.default.query);
      mockDbQuery.mockResolvedValue({ rowCount: 1 });

      const result = await alertingService.deleteAlertThreshold('threshold-1');

      expect(result).toBe(true);
      expect(mockDbQuery).toHaveBeenCalledWith(
        'DELETE FROM alert_thresholds WHERE id = $1',
        ['threshold-1']
      );
    });
  });

  describe('Low Stock Alert Checking', () => {
    it('should create low stock alert when threshold is breached', async () => {
      const mockThresholds = [
        {
          id: 'threshold-1',
          product_id: 'product-1',
          location_id: 'location-1',
          threshold: 10,
          product_name: 'Test Product',
          location_name: 'Test Location'
        }
      ];

      const mockInventory = [
        {
          quantity: 5,
          name: 'Test Product',
          sku: 'TEST-001'
        }
      ];

      const mockDbQuery = vi.mocked(mockDb.default.query);
      mockDbQuery
        .mockResolvedValueOnce({ rows: mockThresholds }) // Get thresholds
        .mockResolvedValueOnce({ rows: mockInventory }) // Get inventory
        .mockResolvedValueOnce({ rows: [] }); // Check for recent alerts

      const mockCreateAlertEvent = vi.mocked(mockNotificationService.default.createAlertEvent);
      const mockProcessAlertEvent = vi.mocked(mockNotificationService.default.processAlertEvent);
      
      mockCreateAlertEvent.mockResolvedValue({ id: 'alert-1' } as any);
      mockProcessAlertEvent.mockResolvedValue();

      await alertingService.checkLowStockAlerts();

      expect(mockCreateAlertEvent).toHaveBeenCalledWith({
        type: AlertEventType.LOW_STOCK,
        severity: AlertSeverity.MEDIUM,
        title: 'Low Stock Alert: Test Product',
        message: 'Product "Test Product" at Test Location has only 5 units remaining (threshold: 10)',
        data: expect.objectContaining({
          productId: 'product-1',
          productName: 'Test Product',
          locationId: 'location-1',
          locationName: 'Test Location',
          currentQuantity: 5,
          threshold: 10
        }),
        locationId: 'location-1',
        productId: 'product-1'
      });

      expect(mockProcessAlertEvent).toHaveBeenCalledWith('alert-1');
    });

    it('should create critical alert when stock is zero', async () => {
      const mockThresholds = [
        {
          id: 'threshold-1',
          product_id: 'product-1',
          location_id: 'location-1',
          threshold: 10,
          product_name: 'Test Product',
          location_name: 'Test Location'
        }
      ];

      const mockInventory = [
        {
          quantity: 0,
          name: 'Test Product',
          sku: 'TEST-001'
        }
      ];

      const mockDbQuery = vi.mocked(mockDb.default.query);
      mockDbQuery
        .mockResolvedValueOnce({ rows: mockThresholds })
        .mockResolvedValueOnce({ rows: mockInventory })
        .mockResolvedValueOnce({ rows: [] });

      const mockCreateAlertEvent = vi.mocked(mockNotificationService.default.createAlertEvent);
      mockCreateAlertEvent.mockResolvedValue({ id: 'alert-1' } as any);

      await alertingService.checkLowStockAlerts();

      expect(mockCreateAlertEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: AlertSeverity.CRITICAL
        })
      );
    });

    it('should not create alert if threshold is not breached', async () => {
      const mockThresholds = [
        {
          id: 'threshold-1',
          product_id: 'product-1',
          location_id: 'location-1',
          threshold: 10,
          product_name: 'Test Product',
          location_name: 'Test Location'
        }
      ];

      const mockInventory = [
        {
          quantity: 15,
          name: 'Test Product',
          sku: 'TEST-001'
        }
      ];

      const mockDbQuery = vi.mocked(mockDb.default.query);
      mockDbQuery
        .mockResolvedValueOnce({ rows: mockThresholds })
        .mockResolvedValueOnce({ rows: mockInventory });

      const mockCreateAlertEvent = vi.mocked(mockNotificationService.default.createAlertEvent);

      await alertingService.checkLowStockAlerts();

      expect(mockCreateAlertEvent).not.toHaveBeenCalled();
    });

    it('should not create duplicate alerts within cooldown period', async () => {
      const mockThresholds = [
        {
          id: 'threshold-1',
          product_id: 'product-1',
          location_id: 'location-1',
          threshold: 10,
          product_name: 'Test Product',
          location_name: 'Test Location'
        }
      ];

      const mockInventory = [
        {
          quantity: 5,
          name: 'Test Product',
          sku: 'TEST-001'
        }
      ];

      const mockRecentAlerts = [
        { id: 'recent-alert' }
      ];

      const mockDbQuery = vi.mocked(mockDb.default.query);
      mockDbQuery
        .mockResolvedValueOnce({ rows: mockThresholds })
        .mockResolvedValueOnce({ rows: mockInventory })
        .mockResolvedValueOnce({ rows: mockRecentAlerts }); // Recent alert exists

      const mockCreateAlertEvent = vi.mocked(mockNotificationService.default.createAlertEvent);

      await alertingService.checkLowStockAlerts();

      expect(mockCreateAlertEvent).not.toHaveBeenCalled();
    });
  });

  describe('Impending Expiration Alert Checking', () => {
    it('should create expiration alert for products expiring soon', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Test Product',
          sku: 'TEST-001',
          location_id: 'location-1',
          location_name: 'Test Location'
        }
      ];

      const mockDbQuery = vi.mocked(mockDb.default.query);
      mockDbQuery
        .mockResolvedValueOnce({ rows: mockProducts }) // Get products
        .mockResolvedValueOnce({ rows: [] }); // Check for recent alerts

      const mockCreateAlertEvent = vi.mocked(mockNotificationService.default.createAlertEvent);
      const mockProcessAlertEvent = vi.mocked(mockNotificationService.default.processAlertEvent);
      
      mockCreateAlertEvent.mockResolvedValue({ id: 'alert-1' } as any);
      mockProcessAlertEvent.mockResolvedValue();

      // Mock Math.random to return value that results in 3 days until expiration
      vi.spyOn(Math, 'random').mockReturnValue(0.1);

      await alertingService.checkImpendingExpirationAlerts();

      expect(mockCreateAlertEvent).toHaveBeenCalledWith({
        type: AlertEventType.IMPENDING_EXPIRATION,
        severity: AlertSeverity.HIGH,
        title: 'Impending Expiration: Test Product',
        message: 'Product "Test Product" at Test Location will expire in 3 day(s)',
        data: expect.objectContaining({
          productId: 'product-1',
          productName: 'Test Product',
          locationId: 'location-1',
          locationName: 'Test Location',
          daysUntilExpiration: expect.any(Number)
        }),
        locationId: 'location-1',
        productId: 'product-1'
      });

      expect(mockProcessAlertEvent).toHaveBeenCalledWith('alert-1');
    });

    it('should not create expiration alert for products not expiring soon', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Test Product',
          sku: 'TEST-001',
          location_id: 'location-1',
          location_name: 'Test Location'
        }
      ];

      const mockDbQuery = vi.mocked(mockDb.default.query);
      mockDbQuery.mockResolvedValueOnce({ rows: mockProducts });

      // Mock Math.random to return value that results in 30+ days until expiration
      vi.spyOn(Math, 'random').mockReturnValue(0.9);

      const mockCreateAlertEvent = vi.mocked(mockNotificationService.default.createAlertEvent);

      await alertingService.checkImpendingExpirationAlerts();

      expect(mockCreateAlertEvent).not.toHaveBeenCalled();
    });
  });

  describe('External Alert Creation', () => {
    it('should create supplier order alert', async () => {
      const orderData = {
        orderNumber: 'PO-12345',
        supplierName: 'Test Supplier',
        status: 'shipped',
        items: [{ name: 'Product X', quantity: 100 }],
        estimatedDelivery: '2024-12-01'
      };

      const mockCreateAlertEvent = vi.mocked(mockNotificationService.default.createAlertEvent);
      const mockProcessAlertEvent = vi.mocked(mockNotificationService.default.processAlertEvent);
      
      mockCreateAlertEvent.mockResolvedValue({ id: 'alert-1' } as any);
      mockProcessAlertEvent.mockResolvedValue();

      await alertingService.createSupplierOrderAlert(orderData);

      expect(mockCreateAlertEvent).toHaveBeenCalledWith({
        type: AlertEventType.SUPPLIER_ORDER_UPDATE,
        severity: AlertSeverity.MEDIUM,
        title: 'Supplier Order Update: PO-12345',
        message: 'Order PO-12345 status updated to shipped',
        data: orderData
      });

      expect(mockProcessAlertEvent).toHaveBeenCalledWith('alert-1');
    });

    it('should create system error alert', async () => {
      const errorData = {
        component: 'Database',
        message: 'Connection timeout',
        stackTrace: 'Error: Connection timeout\\n    at...'
      };

      const mockCreateAlertEvent = vi.mocked(mockNotificationService.default.createAlertEvent);
      const mockProcessAlertEvent = vi.mocked(mockNotificationService.default.processAlertEvent);
      
      mockCreateAlertEvent.mockResolvedValue({ id: 'alert-1' } as any);
      mockProcessAlertEvent.mockResolvedValue();

      await alertingService.createSystemErrorAlert(errorData);

      expect(mockCreateAlertEvent).toHaveBeenCalledWith({
        type: AlertEventType.SYSTEM_ERROR,
        severity: AlertSeverity.HIGH,
        title: 'System Error: Database',
        message: 'Error in Database: Connection timeout',
        data: expect.objectContaining({
          component: 'Database',
          error: 'Connection timeout',
          stackTrace: 'Error: Connection timeout\\n    at...'
        })
      });

      expect(mockProcessAlertEvent).toHaveBeenCalledWith('alert-1');
    });
  });

  describe('Alert History', () => {
    it('should get alert history', async () => {
      const mockHistory = [
        {
          id: 'alert-1',
          type: 'low_stock',
          severity: 'medium',
          title: 'Low Stock Alert',
          created_at: new Date(),
          product_name: 'Test Product',
          location_name: 'Test Location',
          user_name: 'Test User'
        }
      ];

      const mockDbQuery = vi.mocked(mockDb.default.query);
      mockDbQuery.mockResolvedValue({ rows: mockHistory });

      const result = await alertingService.getAlertHistory(20, 10);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'alert-1',
        type: 'low_stock',
        severity: 'medium',
        title: 'Low Stock Alert'
      });

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT ae.*,'),
        [20, 10]
      );
    });
  });
});