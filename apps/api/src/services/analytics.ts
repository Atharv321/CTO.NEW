import db from '../database/connection.js';
import cacheService from './cache.js';
import {
  InventoryValuation,
  InventoryTurnover,
  WastageReport,
  LocationPerformance,
  AnalyticsFilters,
  ChartData,
  ChartDataset
} from '@shared/types';

export class AnalyticsService {
  // Inventory Valuation
  async getInventoryValuation(filters: AnalyticsFilters): Promise<InventoryValuation[]> {
    const cacheKey = cacheService.generateCacheKey('inventory_valuation', filters);
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    let query = `
      SELECT 
        l.id as location_id,
        l.name as location_name,
        SUM(ii.quantity * p.cost) as total_value,
        SUM(ii.quantity) as total_items,
        CURRENT_DATE as date
      FROM inventory_items ii
      JOIN products p ON ii.product_id = p.id
      JOIN locations l ON ii.location_id = l.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters.locationIds?.length) {
      query += ` AND l.id = ANY($${paramIndex++})`;
      params.push(filters.locationIds);
    }

    query += `
      GROUP BY l.id, l.name
      ORDER BY total_value DESC
    `;

    const result = await db.query(query, params);
    const valuations: InventoryValuation[] = [];

    for (const row of result.rows) {
      // Get category breakdown for each location
      const categoryQuery = `
        SELECT 
          p.category,
          SUM(ii.quantity * p.cost) as value,
          SUM(ii.quantity) as item_count
        FROM inventory_items ii
        JOIN products p ON ii.product_id = p.id
        WHERE ii.location_id = $1
        GROUP BY p.category
        ORDER BY value DESC
      `;

      const categoryResult = await db.query(categoryQuery, [row.location_id]);
      const totalValue = parseFloat(row.total_value);
      
      const categoryBreakdown = categoryResult.rows.map(cat => ({
        category: cat.category,
        value: parseFloat(cat.value),
        itemCount: parseInt(cat.item_count),
        percentage: totalValue > 0 ? (parseFloat(cat.value) / totalValue) * 100 : 0
      }));

      valuations.push({
        locationId: row.location_id,
        locationName: row.location_name,
        totalValue,
        totalItems: parseInt(row.total_items),
        categoryBreakdown,
        date: row.date
      });
    }

    await cacheService.set(cacheKey, valuations, 600); // Cache for 10 minutes
    return valuations;
  }

  // Inventory Turnover
  async getInventoryTurnover(filters: AnalyticsFilters): Promise<InventoryTurnover[]> {
    const cacheKey = cacheService.generateCacheKey('inventory_turnover', filters);
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const period = filters.period || 'monthly';
    let dateTrunc = 'month';
    if (period === 'daily') dateTrunc = 'day';
    if (period === 'weekly') dateTrunc = 'week';

    let query = `
      WITH period_data AS (
        SELECT 
          l.id as location_id,
          l.name as location_name,
          DATE_TRUNC('${dateTrunc}', sm.created_at) as period,
          SUM(CASE WHEN sm.type IN ('out', 'waste') THEN sm.quantity * p.cost ELSE 0 END) as cost_of_goods_sold,
          AVG(ii.quantity * p.cost) as average_inventory_value
        FROM stock_movements sm
        JOIN products p ON sm.product_id = p.id
        JOIN locations l ON sm.location_id = l.id
        LEFT JOIN inventory_items ii ON sm.product_id = ii.product_id AND sm.location_id = ii.location_id
        WHERE sm.created_at >= COALESCE($1, CURRENT_DATE - INTERVAL '30 days')
          AND sm.created_at <= COALESCE($2, CURRENT_DATE)
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters.startDate) {
      params.push(filters.startDate);
    } else {
      params.push(null);
    }
    paramIndex++;

    if (filters.endDate) {
      params.push(filters.endDate);
    } else {
      params.push(null);
    }
    paramIndex++;

    if (filters.locationIds?.length) {
      query += ` AND l.id = ANY($${paramIndex++})`;
      params.push(filters.locationIds);
    }

    query += `
        GROUP BY l.id, l.name, DATE_TRUNC('${dateTrunc}', sm.created_at)
      )
      SELECT 
        location_id,
        location_name,
        TO_CHAR(period, 'YYYY-MM-DD') as period,
        CASE 
          WHEN average_inventory_value > 0 
          THEN ROUND(cost_of_goods_sold / average_inventory_value, 2)
          ELSE 0
        END as turnover_ratio,
        CASE 
          WHEN cost_of_goods_sold > 0 
          THEN ROUND(average_inventory_value / (cost_of_goods_sold / 30), 1)
          ELSE 0
        END as days_of_supply,
        COALESCE(cost_of_goods_sold, 0) as cost_of_goods_sold,
        COALESCE(average_inventory_value, 0) as average_inventory
      FROM period_data
      ORDER BY period DESC, location_name
    `;

    const result = await db.query(query, params);

    const turnovers: InventoryTurnover[] = result.rows.map(row => ({
      period: row.period,
      locationId: row.location_id,
      locationName: row.location_name,
      turnoverRatio: parseFloat(row.turnover_ratio),
      daysOfSupply: parseFloat(row.days_of_supply),
      costOfGoodsSold: parseFloat(row.cost_of_goods_sold),
      averageInventory: parseFloat(row.average_inventory)
    }));

    await cacheService.set(cacheKey, turnovers, 1800); // Cache for 30 minutes
    return turnovers;
  }

  // Wastage Report
  async getWastageReport(filters: AnalyticsFilters): Promise<WastageReport[]> {
    const cacheKey = cacheService.generateCacheKey('wastage_report', filters);
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const period = filters.period || 'monthly';
    let dateTrunc = 'month';
    if (period === 'daily') dateTrunc = 'day';
    if (period === 'weekly') dateTrunc = 'week';

    let query = `
      WITH wastage_data AS (
        SELECT 
          l.id as location_id,
          l.name as location_name,
          DATE_TRUNC('${dateTrunc}', sm.created_at) as period,
          SUM(sm.quantity * p.cost) as wastage_value,
          SUM(sm.quantity) as total_wastage,
          SUM(CASE WHEN sm.type IN ('out') THEN sm.quantity * p.cost ELSE 0 END) as total_out_value
        FROM stock_movements sm
        JOIN products p ON sm.product_id = p.id
        JOIN locations l ON sm.location_id = l.id
        WHERE sm.type = 'waste'
          AND sm.created_at >= COALESCE($1, CURRENT_DATE - INTERVAL '30 days')
          AND sm.created_at <= COALESCE($2, CURRENT_DATE)
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters.startDate) {
      params.push(filters.startDate);
    } else {
      params.push(null);
    }
    paramIndex++;

    if (filters.endDate) {
      params.push(filters.endDate);
    } else {
      params.push(null);
    }
    paramIndex++;

    if (filters.locationIds?.length) {
      query += ` AND l.id = ANY($${paramIndex++})`;
      params.push(filters.locationIds);
    }

    query += `
        GROUP BY l.id, l.name, DATE_TRUNC('${dateTrunc}', sm.created_at)
      )
      SELECT 
        location_id,
        location_name,
        TO_CHAR(period, 'YYYY-MM-DD') as period,
        COALESCE(total_wastage, 0) as total_wastage,
        COALESCE(wastage_value, 0) as wastage_value,
        CASE 
          WHEN total_out_value > 0 
          THEN ROUND((wastage_value / total_out_value) * 100, 2)
          ELSE 0
        END as wastage_percentage
      FROM wastage_data
      ORDER BY period DESC, wastage_value DESC
    `;

    const result = await db.query(query, params);
    const reports: WastageReport[] = [];

    for (const row of result.rows) {
      // Get top wasted items for this location and period
      const topItemsQuery = `
        SELECT 
          p.id as product_id,
          p.name as product_name,
          SUM(sm.quantity) as quantity,
          SUM(sm.quantity * p.cost) as value,
          sm.reason
        FROM stock_movements sm
        JOIN products p ON sm.product_id = p.id
        WHERE sm.type = 'waste'
          AND sm.location_id = $1
          AND DATE_TRUNC('${dateTrunc}', sm.created_at) = DATE_TRUNC('${dateTrunc}', $2::date)
        GROUP BY p.id, p.name, sm.reason
        ORDER BY value DESC
        LIMIT 10
      `;

      const topItemsResult = await db.query(topItemsQuery, [row.location_id, row.period]);
      
      const topWastedItems = topItemsResult.rows.map(item => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: parseInt(item.quantity),
        value: parseFloat(item.value),
        reason: item.reason
      }));

      reports.push({
        period: row.period,
        locationId: row.location_id,
        locationName: row.location_name,
        totalWastage: parseInt(row.total_wastage),
        wastageValue: parseFloat(row.wastage_value),
        wastagePercentage: parseFloat(row.wastage_percentage),
        topWastedItems
      });
    }

    await cacheService.set(cacheKey, reports, 1800); // Cache for 30 minutes
    return reports;
  }

  // Location Performance
  async getLocationPerformance(filters: AnalyticsFilters): Promise<LocationPerformance[]> {
    const cacheKey = cacheService.generateCacheKey('location_performance', filters);
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const period = filters.period || 'monthly';
    let dateTrunc = 'month';
    if (period === 'daily') dateTrunc = 'day';
    if (period === 'weekly') dateTrunc = 'week';

    let query = `
      WITH performance_data AS (
        SELECT 
          l.id as location_id,
          l.name as location_name,
          DATE_TRUNC('${dateTrunc}', sm.created_at) as period,
          SUM(CASE WHEN sm.type = 'out' THEN sm.quantity * p.price ELSE 0 END) as revenue,
          SUM(CASE WHEN sm.type IN ('out', 'waste') THEN sm.quantity * p.cost ELSE 0 END) as cost_of_goods_sold,
          SUM(CASE WHEN sm.type = 'waste' THEN sm.quantity * p.cost ELSE 0 END) as wastage_value,
          SUM(CASE WHEN sm.type IN ('out', 'waste') THEN sm.quantity * p.cost ELSE 0 END) as total_cogs
        FROM stock_movements sm
        JOIN products p ON sm.product_id = p.id
        JOIN locations l ON sm.location_id = l.id
        WHERE sm.created_at >= COALESCE($1, CURRENT_DATE - INTERVAL '30 days')
          AND sm.created_at <= COALESCE($2, CURRENT_DATE)
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters.startDate) {
      params.push(filters.startDate);
    } else {
      params.push(null);
    }
    paramIndex++;

    if (filters.endDate) {
      params.push(filters.endDate);
    } else {
      params.push(null);
    }
    paramIndex++;

    if (filters.locationIds?.length) {
      query += ` AND l.id = ANY($${paramIndex++})`;
      params.push(filters.locationIds);
    }

    query += `
        GROUP BY l.id, l.name, DATE_TRUNC('${dateTrunc}', sm.created_at)
      ),
      turnover_data AS (
        SELECT 
          l.id as location_id,
          DATE_TRUNC('${dateTrunc}', sm.created_at) as period,
          CASE 
            WHEN AVG(ii.quantity * p.cost) > 0 
            THEN ROUND(SUM(CASE WHEN sm.type IN ('out', 'waste') THEN sm.quantity * p.cost ELSE 0 END) / AVG(ii.quantity * p.cost), 2)
            ELSE 0
          END as inventory_turnover
        FROM stock_movements sm
        JOIN products p ON sm.product_id = p.id
        JOIN locations l ON sm.location_id = l.id
        LEFT JOIN inventory_items ii ON sm.product_id = ii.product_id AND sm.location_id = ii.location_id
        WHERE sm.created_at >= COALESCE($1, CURRENT_DATE - INTERVAL '30 days')
          AND sm.created_at <= COALESCE($2, CURRENT_DATE)
        GROUP BY l.id, DATE_TRUNC('${dateTrunc}', sm.created_at)
      )
      SELECT 
        pd.location_id,
        pd.location_name,
        TO_CHAR(pd.period, 'YYYY-MM-DD') as period,
        COALESCE(pd.revenue, 0) as revenue,
        COALESCE(pd.cost_of_goods_sold, 0) as cost_of_goods_sold,
        COALESCE(pd.revenue, 0) - COALESCE(pd.cost_of_goods_sold, 0) as gross_profit,
        CASE 
          WHEN pd.revenue > 0 
          THEN ROUND(((pd.revenue - pd.cost_of_goods_sold) / pd.revenue) * 100, 2)
          ELSE 0
        END as gross_margin,
        COALESCE(td.inventory_turnover, 0) as inventory_turnover,
        CASE 
          WHEN pd.total_cogs > 0 
          THEN ROUND((pd.wastage_value / pd.total_cogs) * 100, 2)
          ELSE 0
        END as wastage_percentage
      FROM performance_data pd
      LEFT JOIN turnover_data td ON pd.location_id = td.location_id AND pd.period = td.period
      ORDER BY pd.period DESC, pd.gross_profit DESC
    `;

    const result = await db.query(query, params);

    const performance: LocationPerformance[] = result.rows.map(row => ({
      period: row.period,
      locationId: row.location_id,
      locationName: row.location_name,
      revenue: parseFloat(row.revenue),
      costOfGoodsSold: parseFloat(row.cost_of_goods_sold),
      grossProfit: parseFloat(row.gross_profit),
      grossMargin: parseFloat(row.gross_margin),
      inventoryTurnover: parseFloat(row.inventory_turnover),
      wastagePercentage: parseFloat(row.wastage_percentage)
    }));

    await cacheService.set(cacheKey, performance, 1800); // Cache for 30 minutes
    return performance;
  }

  // Chart Data Helpers
  async getValuationChartData(filters: AnalyticsFilters): Promise<ChartData> {
    const valuations = await this.getInventoryValuation(filters);
    
    return {
      labels: valuations.map(v => v.locationName),
      datasets: [{
        label: 'Inventory Value ($)',
        data: valuations.map(v => v.totalValue),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)'
      }]
    };
  }

  async getTurnoverChartData(filters: AnalyticsFilters): Promise<ChartData> {
    const turnovers = await this.getInventoryTurnover(filters);
    
    const periods = [...new Set(turnovers.map(t => t.period))].sort();
    const locations = [...new Set(turnovers.map(t => t.locationName))];
    
    const datasets: ChartDataset[] = locations.map((location, index) => {
      const colors = [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)'
      ];
      
      return {
        label: location,
        data: periods.map(period => {
          const turnover = turnovers.find(t => t.period === period && t.locationName === location);
          return turnover ? turnover.turnoverRatio : 0;
        }),
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length].replace('0.6', '1')
      };
    });

    return {
      labels: periods,
      datasets
    };
  }

  async getWastageChartData(filters: AnalyticsFilters): Promise<ChartData> {
    const wastage = await this.getWastageReport(filters);
    
    return {
      labels: wastage.map(w => `${w.locationName} - ${w.period}`),
      datasets: [{
        label: 'Wastage Value ($)',
        data: wastage.map(w => w.wastageValue),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)'
      }]
    };
  }

  async getPerformanceChartData(filters: AnalyticsFilters): Promise<ChartData> {
    const performance = await this.getLocationPerformance(filters);
    
    const periods = [...new Set(performance.map(p => p.period))].sort();
    const locations = [...new Set(performance.map(p => p.locationName))];
    
    const datasets: ChartDataset[] = locations.map((location, index) => {
      const colors = [
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)',
        'rgba(199, 199, 199, 0.6)'
      ];
      
      return {
        label: `${location} Gross Margin %`,
        data: periods.map(period => {
          const perf = performance.find(p => p.period === period && p.locationName === location);
          return perf ? perf.grossMargin : 0;
        }),
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length].replace('0.6', '1')
      };
    });

    return {
      labels: periods,
      datasets
    };
  }

  // Cache invalidation
  async invalidateAnalyticsCache(): Promise<void> {
    await cacheService.invalidatePattern('analytics:*');
    await cacheService.invalidatePattern('inventory_*');
    await cacheService.invalidatePattern('wastage_*');
    await cacheService.invalidatePattern('turnover_*');
    await cacheService.invalidatePattern('performance_*');
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;