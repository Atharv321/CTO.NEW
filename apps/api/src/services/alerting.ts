import { AlertEventType, AlertSeverity, AlertThreshold } from '@shared/types';
import notificationService from './notifications.js';
import db from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';

export class AlertingWorkerService {
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Alerting worker is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚨 Starting alerting worker...');

    // Process notification queue every 30 seconds
    this.intervalId = setInterval(async () => {
      await notificationService.processNotificationQueue();
    }, 30000);

    // Check for alert conditions every 2 minutes
    setInterval(async () => {
      await this.checkLowStockAlerts();
      await this.checkImpendingExpirationAlerts();
    }, 120000);

    console.log('✅ Alerting worker started successfully');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('🛑 Alerting worker stopped');
  }

  async createAlertThreshold(thresholdData: Omit<AlertThreshold, 'id' | 'createdAt' | 'updatedAt'>): Promise<AlertThreshold> {
    const threshold: AlertThreshold = {
      id: uuidv4(),
      ...thresholdData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.query(
      `INSERT INTO alert_thresholds (id, location_id, product_id, type, threshold, unit, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (location_id, product_id, type) 
       DO UPDATE SET threshold = EXCLUDED.threshold, unit = EXCLUDED.unit, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at`,
      [
        threshold.id,
        threshold.locationId,
        threshold.productId,
        threshold.type,
        threshold.threshold,
        threshold.unit,
        threshold.isActive,
        threshold.createdAt,
        threshold.updatedAt
      ]
    );

    return threshold;
  }

  async checkLowStockAlerts(): Promise<void> {
    try {
      // Get all active low stock thresholds
      const thresholdsResult = await db.query(
        `SELECT at.*, p.name as product_name, l.name as location_name
         FROM alert_thresholds at
         JOIN products p ON at.product_id = p.id
         JOIN locations l ON at.location_id = l.id
         WHERE at.type = 'low_stock' AND at.is_active = true`
      );

      for (const threshold of thresholdsResult.rows) {
        // Check current inventory levels
        const inventoryResult = await db.query(
          `SELECT ii.quantity, p.name, p.sku
           FROM inventory_items ii
           JOIN products p ON ii.product_id = p.id
           WHERE ii.product_id = $1 AND ii.location_id = $2`,
          [threshold.product_id, threshold.location_id]
        );

        if (inventoryResult.rows.length === 0) {
          continue; // No inventory record found
        }

        const currentQuantity = inventoryResult.rows[0].quantity;

        if (currentQuantity <= threshold.threshold) {
          // Check if we already created an alert for this condition recently
          const recentAlertResult = await db.query(
            `SELECT id FROM alert_events 
             WHERE type = 'low_stock' 
               AND product_id = $1 
               AND location_id = $2 
               AND created_at > NOW() - INTERVAL '1 hour'`,
            [threshold.product_id, threshold.location_id]
          );

          if (recentAlertResult.rows.length === 0) {
            await this.createLowStockAlert(threshold, currentQuantity);
          }
        }
      }
    } catch (error) {
      console.error('Error checking low stock alerts:', error);
    }
  }

  private async createLowStockAlert(threshold: any, currentQuantity: number): Promise<void> {
    const severity = currentQuantity === 0 ? AlertSeverity.CRITICAL : 
                    currentQuantity <= threshold.threshold * 0.5 ? AlertSeverity.HIGH : 
                    AlertSeverity.MEDIUM;

    const alertEvent = await notificationService.createAlertEvent({
      type: AlertEventType.LOW_STOCK,
      severity,
      title: `Low Stock Alert: ${threshold.product_name}`,
      message: `Product "${threshold.product_name}" at ${threshold.location_name} has only ${currentQuantity} units remaining (threshold: ${threshold.threshold})`,
      data: {
        productId: threshold.product_id,
        productName: threshold.product_name,
        locationId: threshold.location_id,
        locationName: threshold.location_name,
        currentQuantity,
        threshold: threshold.threshold,
        sku: threshold.sku
      },
      locationId: threshold.location_id,
      productId: threshold.product_id
    });

    await notificationService.processAlertEvent(alertEvent.id);
    console.log(`🚨 Low stock alert created: ${threshold.product_name} at ${threshold.location_name}`);
  }

  async checkImpendingExpirationAlerts(): Promise<void> {
    try {
      // This would typically require an expiration_date field in products or inventory_items
      // For now, we'll simulate with a mock scenario
      const expiringProductsResult = await db.query(
        `SELECT DISTINCT p.id, p.name, p.sku, l.id as location_id, l.name as location_name
         FROM products p
         JOIN inventory_items ii ON p.id = ii.product_id
         JOIN locations l ON ii.location_id = l.id
         WHERE ii.quantity > 0
         ORDER BY p.name, l.name`
      );

      for (const product of expiringProductsResult.rows) {
        // Mock expiration check - in reality, this would check actual expiration dates
        const daysUntilExpiration = Math.floor(Math.random() * 30);
        
        if (daysUntilExpiration <= 7 && daysUntilExpiration > 0) {
          // Check if we already created an alert for this condition recently
          const recentAlertResult = await db.query(
            `SELECT id FROM alert_events 
             WHERE type = 'impending_expiration' 
               AND product_id = $1 
               AND location_id = $2 
               AND created_at > NOW() - INTERVAL '24 hours'`,
            [product.id, product.location_id]
          );

          if (recentAlertResult.rows.length === 0) {
            await this.createExpirationAlert(product, daysUntilExpiration);
          }
        }
      }
    } catch (error) {
      console.error('Error checking expiration alerts:', error);
    }
  }

  private async createExpirationAlert(product: any, daysUntilExpiration: number): Promise<void> {
    const severity = daysUntilExpiration <= 1 ? AlertSeverity.CRITICAL :
                    daysUntilExpiration <= 3 ? AlertSeverity.HIGH :
                    AlertSeverity.MEDIUM;

    const alertEvent = await notificationService.createAlertEvent({
      type: AlertEventType.IMPENDING_EXPIRATION,
      severity,
      title: `Impending Expiration: ${product.name}`,
      message: `Product "${product.name}" at ${product.location_name} will expire in ${daysUntilExpiration} day(s)`,
      data: {
        productId: product.id,
        productName: product.name,
        locationId: product.location_id,
        locationName: product.location_name,
        daysUntilExpiration,
        sku: product.sku
      },
      locationId: product.location_id,
      productId: product.id
    });

    await notificationService.processAlertEvent(alertEvent.id);
    console.log(`⏰ Expiration alert created: ${product.name} expires in ${daysUntilExpiration} days`);
  }

  async createSupplierOrderAlert(orderData: any): Promise<void> {
    const alertEvent = await notificationService.createAlertEvent({
      type: AlertEventType.SUPPLIER_ORDER_UPDATE,
      severity: AlertSeverity.MEDIUM,
      title: `Supplier Order Update: ${orderData.orderNumber}`,
      message: `Order ${orderData.orderNumber} status updated to ${orderData.status}`,
      data: {
        orderNumber: orderData.orderNumber,
        supplierName: orderData.supplierName,
        status: orderData.status,
        items: orderData.items,
        estimatedDelivery: orderData.estimatedDelivery
      }
    });

    await notificationService.processAlertEvent(alertEvent.id);
    console.log(`📦 Supplier order alert created: ${orderData.orderNumber}`);
  }

  async createSystemErrorAlert(errorData: any): Promise<void> {
    const alertEvent = await notificationService.createAlertEvent({
      type: AlertEventType.SYSTEM_ERROR,
      severity: AlertSeverity.HIGH,
      title: `System Error: ${errorData.component}`,
      message: `Error in ${errorData.component}: ${errorData.message}`,
      data: {
        component: errorData.component,
        error: errorData.message,
        stackTrace: errorData.stackTrace,
        timestamp: new Date().toISOString()
      }
    });

    await notificationService.processAlertEvent(alertEvent.id);
    console.log(`🚨 System error alert created: ${errorData.component}`);
  }

  async getAlertThresholds(locationId?: string, productId?: string): Promise<AlertThreshold[]> {
    let query = `
      SELECT at.*, p.name as product_name, l.name as location_name
      FROM alert_thresholds at
      LEFT JOIN products p ON at.product_id = p.id
      LEFT JOIN locations l ON at.location_id = l.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;

    if (locationId) {
      query += ` AND at.location_id = $${paramIndex++}`;
      params.push(locationId);
    }

    if (productId) {
      query += ` AND at.product_id = $${paramIndex++}`;
      params.push(productId);
    }

    query += ` ORDER BY at.type, l.name, p.name`;

    const result = await db.query(query, params);
    return result.rows.map(row => ({
      id: row.id,
      locationId: row.location_id,
      productId: row.product_id,
      type: row.type,
      threshold: parseFloat(row.threshold),
      unit: row.unit,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async updateAlertThreshold(thresholdId: string, updates: Partial<AlertThreshold>): Promise<boolean> {
    const setClause = [];
    const params = [];
    let paramIndex = 1;

    if (updates.threshold !== undefined) {
      setClause.push(`threshold = $${paramIndex++}`);
      params.push(updates.threshold);
    }

    if (updates.unit !== undefined) {
      setClause.push(`unit = $${paramIndex++}`);
      params.push(updates.unit);
    }

    if (updates.isActive !== undefined) {
      setClause.push(`is_active = $${paramIndex++}`);
      params.push(updates.isActive);
    }

    if (setClause.length === 0) {
      return false;
    }

    setClause.push(`updated_at = $${paramIndex++}`);
    params.push(new Date());

    params.push(thresholdId);

    const query = `
      UPDATE alert_thresholds 
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex}
    `;

    const result = await db.query(query, params);
    return result.rowCount > 0;
  }

  async deleteAlertThreshold(thresholdId: string): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM alert_thresholds WHERE id = $1',
      [thresholdId]
    );
    return result.rowCount > 0;
  }

  async getAlertHistory(limit: number = 50, offset: number = 0): Promise<any[]> {
    const result = await db.query(
      `SELECT ae.*, 
              p.name as product_name, 
              l.name as location_name,
              u.name as user_name
       FROM alert_events ae
       LEFT JOIN products p ON ae.product_id = p.id
       LEFT JOIN locations l ON ae.location_id = l.id
       LEFT JOIN users u ON ae.user_id = u.id
       ORDER BY ae.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;
  }
}

export default new AlertingWorkerService();