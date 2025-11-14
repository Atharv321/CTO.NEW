const DatabaseService = require('./database');

class LowStockService {
  constructor() {
    this.db = new DatabaseService();
  }

  // Get all items that are at or below their low stock threshold
  async getLowStockItems(locationId = null) {
    try {
      const alerts = await this.db.getLowStockAlerts(locationId);
      return {
        success: true,
        data: alerts,
        count: alerts.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get low stock items: ${error.message}`);
    }
  }

  // Get items that will soon reach low stock (predictive)
  async getItemsApproachingLowStock(locationId = null, daysAhead = 7) {
    try {
      // Calculate average daily consumption from the last 30 days
      const query = `
        WITH consumption_rates AS (
          SELECT 
            sm.product_id,
            sm.location_id,
            AVG(sm.quantity) as avg_daily_consumption,
            COUNT(*) as consumption_days
          FROM stock_movements sm
          WHERE sm.movement_type = 'CONSUME'
            AND sm.created_at >= NOW() - INTERVAL '30 days'
            AND ($1::UUID IS NULL OR sm.location_id = $1::UUID)
          GROUP BY sm.product_id, sm.location_id
        ),
        current_inventory AS (
          SELECT 
            i.product_id,
            i.location_id,
            i.quantity,
            i.low_stock_threshold,
            (i.quantity - i.reserved_quantity) as available_quantity
          FROM inventory i
          WHERE i.low_stock_threshold > 0
            AND ($1::UUID IS NULL OR i.location_id = $1::UUID)
        )
        SELECT 
          ci.product_id,
          p.sku,
          p.name as product_name,
          ci.location_id,
          l.name as location_name,
          ci.quantity,
          ci.low_stock_threshold,
          ci.available_quantity,
          cr.avg_daily_consumption,
          CASE 
            WHEN cr.avg_daily_consumption > 0 THEN 
              FLOOR((ci.available_quantity - ci.low_stock_threshold) / cr.avg_daily_consumption)
            ELSE NULL
          end as days_until_low_stock,
          CASE 
            WHEN cr.avg_daily_consumption > 0 
              AND (ci.available_quantity - ci.low_stock_threshold) / cr.avg_daily_consumption <= $2 
            THEN true
            ELSE false
          end as is_approaching_low_stock
        FROM current_inventory ci
        JOIN products p ON ci.product_id = p.id
        JOIN locations l ON ci.location_id = l.id
        LEFT JOIN consumption_rates cr ON ci.product_id = cr.product_id AND ci.location_id = cr.location_id
        WHERE ci.available_quantity > ci.low_stock_threshold
          AND cr.avg_daily_consumption > 0
          AND (ci.available_quantity - ci.low_stock_threshold) / cr.avg_daily_consumption <= $2
        ORDER BY days_until_low_stock ASC
      `;

      const result = await this.db.query(query, [locationId, daysAhead]);
      
      return {
        success: true,
        data: result.rows,
        count: result.rows.length,
        parameters: {
          locationId,
          daysAhead
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get items approaching low stock: ${error.message}`);
    }
  }

  // Generate low stock notifications
  async generateLowStockNotifications(locationId = null) {
    try {
      const [lowStockItems, approachingItems] = await Promise.all([
        this.getLowStockItems(locationId),
        this.getItemsApproachingLowStock(locationId, 7)
      ]);

      const notifications = [];

      // Critical low stock notifications
      lowStockItems.data.forEach(item => {
        notifications.push({
          type: 'LOW_STOCK_CRITICAL',
          priority: 'HIGH',
          productId: item.product_id,
          locationId: item.location_id,
          sku: item.sku,
          productName: item.product_name,
          locationName: item.location_name,
          currentQuantity: parseFloat(item.current_quantity),
          threshold: parseFloat(item.threshold),
          availableQuantity: parseFloat(item.available_quantity),
          shortageAmount: parseFloat(item.shortage_amount),
          message: `Critical: ${item.product_name} at ${item.location_name} is below low stock threshold. Available: ${item.available_quantity}, Threshold: ${item.threshold}`,
          recommendedAction: 'Reorder immediately',
          timestamp: new Date().toISOString()
        });
      });

      // Warning notifications for approaching low stock
      approachingItems.data.forEach(item => {
        notifications.push({
          type: 'LOW_STOCK_WARNING',
          priority: 'MEDIUM',
          productId: item.product_id,
          locationId: item.location_id,
          sku: item.sku,
          productName: item.product_name,
          locationName: item.location_name,
          currentQuantity: parseFloat(item.quantity),
          threshold: parseFloat(item.low_stock_threshold),
          availableQuantity: parseFloat(item.available_quantity),
          averageDailyConsumption: parseFloat(item.avg_daily_consumption),
          daysUntilLowStock: item.days_until_low_stock,
          message: `Warning: ${item.product_name} at ${item.location_name} will reach low stock in ${item.days_until_low_stock} days`,
          recommendedAction: 'Plan reorder within the next week',
          timestamp: new Date().toISOString()
        });
      });

      return {
        success: true,
        notifications,
        summary: {
          critical: notifications.filter(n => n.type === 'LOW_STOCK_CRITICAL').length,
          warning: notifications.filter(n => n.type === 'LOW_STOCK_WARNING').length,
          total: notifications.length
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to generate notifications: ${error.message}`);
    }
  }

  // Get stock health metrics
  async getStockHealthMetrics(locationId = null) {
    try {
      const query = `
        WITH inventory_stats AS (
          SELECT 
            COUNT(*) as total_items,
            COUNT(CASE WHEN (i.quantity - i.reserved_quantity) <= i.low_stock_threshold THEN 1 END) as low_stock_items,
            COUNT(CASE WHEN i.low_stock_threshold > 0 THEN 1 END) as tracked_items,
            SUM(i.quantity - i.reserved_quantity) as total_available_quantity,
            SUM(i.low_stock_threshold) as total_threshold_quantity
          FROM inventory i
          WHERE ($1::UUID IS NULL OR i.location_id = $1::UUID)
        ),
        movement_stats AS (
          SELECT 
            COUNT(*) as total_movements,
            COUNT(CASE WHEN movement_type = 'RECEIVE' THEN 1 END) as receives,
            COUNT(CASE WHEN movement_type = 'CONSUME' THEN 1 END) as consumes,
            COUNT(CASE WHEN movement_type = 'ADJUST' THEN 1 END) as adjustments
          FROM stock_movements sm
          WHERE sm.created_at >= NOW() - INTERVAL '7 days'
            AND ($1::UUID IS NULL OR sm.location_id = $1::UUID)
        )
        SELECT 
          is.*,
          ms.*,
          CASE 
            WHEN is.tracked_items > 0 THEN 
              ROUND((is.low_stock_items::DECIMAL / is.tracked_items::DECIMAL) * 100, 2)
            ELSE 0 
          end as low_stock_percentage,
          CASE 
            WHEN is.total_threshold_quantity > 0 THEN 
              ROUND((is.total_available_quantity::DECIMAL / is.total_threshold_quantity::DECIMAL) * 100, 2)
            ELSE 0 
          end as inventory_health_score
        FROM inventory_stats is, movement_stats ms
      `;

      const result = await this.db.query(query, [locationId]);
      const metrics = result.rows[0];

      return {
        success: true,
        data: {
          totalItems: parseInt(metrics.total_items),
          lowStockItems: parseInt(metrics.low_stock_items),
          trackedItems: parseInt(metrics.tracked_items),
          lowStockPercentage: parseFloat(metrics.low_stock_percentage),
          inventoryHealthScore: parseFloat(metrics.inventory_health_score),
          totalAvailableQuantity: parseFloat(metrics.total_available_quantity),
          weeklyMovements: {
            total: parseInt(metrics.total_movements),
            receives: parseInt(metrics.receives),
            consumes: parseInt(metrics.consumes),
            adjustments: parseInt(metrics.adjustments)
          },
          healthStatus: this.getHealthStatus(parseFloat(metrics.inventory_health_score), parseFloat(metrics.low_stock_percentage))
        },
        locationId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get stock health metrics: ${error.message}`);
    }
  }

  // Helper method to determine health status
  getHealthStatus(healthScore, lowStockPercentage) {
    if (healthScore >= 150 && lowStockPercentage <= 5) {
      return 'EXCELLENT';
    } else if (healthScore >= 120 && lowStockPercentage <= 10) {
      return 'GOOD';
    } else if (healthScore >= 100 && lowStockPercentage <= 20) {
      return 'FAIR';
    } else if (healthScore >= 80 && lowStockPercentage <= 30) {
      return 'POOR';
    } else {
      return 'CRITICAL';
    }
  }

  // Get top consuming products
  async getTopConsumingProducts(locationId = null, days = 30, limit = 10) {
    try {
      const query = `
        SELECT 
          sm.product_id,
          p.sku,
          p.name as product_name,
          SUM(sm.quantity) as total_consumed,
          COUNT(*) as consumption_events,
          AVG(sm.quantity) as avg_consumption_per_event,
          MAX(sm.created_at) as last_consumption_date
        FROM stock_movements sm
        JOIN products p ON sm.product_id = p.id
        WHERE sm.movement_type = 'CONSUME'
          AND sm.created_at >= NOW() - INTERVAL '${days} days'
          AND ($1::UUID IS NULL OR sm.location_id = $1::UUID)
        GROUP BY sm.product_id, p.sku, p.name
        ORDER BY total_consumed DESC
        LIMIT $2
      `;

      const result = await this.db.query(query, [locationId, limit]);

      return {
        success: true,
        data: result.rows,
        parameters: {
          locationId,
          days,
          limit
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get top consuming products: ${error.message}`);
    }
  }

  // Get slow-moving inventory
  async getSlowMovingInventory(locationId = null, days = 90) {
    try {
      const query = `
        WITH last_consumption AS (
          SELECT 
            sm.product_id,
            sm.location_id,
            MAX(sm.created_at) as last_consumed
          FROM stock_movements sm
          WHERE sm.movement_type = 'CONSUME'
            AND ($1::UUID IS NULL OR sm.location_id = $1::UUID)
          GROUP BY sm.product_id, sm.location_id
        )
        SELECT 
          i.product_id,
          p.sku,
          p.name as product_name,
          i.location_id,
          l.name as location_name,
          i.quantity,
          i.low_stock_threshold,
          (i.quantity - i.reserved_quantity) as available_quantity,
          COALESCE(lc.last_consumed, 'Never') as last_consumed,
          CASE 
            WHEN lc.last_consumed IS NULL THEN 'Never consumed'
            WHEN lc.last_consumed < NOW() - INTERVAL '${days} days' THEN 'Slow moving'
            ELSE 'Active'
          end as movement_status,
          CASE 
            WHEN lc.last_consumed IS NULL THEN NULL
            ELSE EXTRACT(DAYS FROM NOW() - lc.last_consumed)
          end as days_since_last_consumption
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        JOIN locations l ON i.location_id = l.id
        LEFT JOIN last_consumption lc ON i.product_id = lc.product_id AND i.location_id = lc.location_id
        WHERE ($1::UUID IS NULL OR i.location_id = $1::UUID)
          AND (i.quantity - i.reserved_quantity) > 0
          AND (lc.last_consumed IS NULL OR lc.last_consumed < NOW() - INTERVAL '${days} days')
        ORDER BY 
          CASE WHEN lc.last_consumed IS NULL THEN 0 ELSE 1 END,
          lc.last_consumed ASC
      `;

      const result = await this.db.query(query, [locationId]);

      return {
        success: true,
        data: result.rows,
        parameters: {
          locationId,
          days
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get slow moving inventory: ${error.message}`);
    }
  }

  async close() {
    await this.db.close();
  }
}

module.exports = LowStockService;