import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { analyticsService } from '../src/services/analytics.js';
import db from '../src/database/connection.js';
import seedData from '../src/database/seed.js';

describe('Analytics Service', () => {
  beforeAll(async () => {
    // Set up test database connection
    process.env.DATABASE_URL = 'postgresql://localhost:5432/inventory_test_db';
    
    // Run migrations and seed data
    await import('../src/database/migrate.js');
    await seedData();
  });

  afterAll(async () => {
    await db.end();
  });

  beforeEach(async () => {
    // Clear any cache before each test
    await analyticsService.invalidateAnalyticsCache();
  });

  describe('Inventory Valuation', () => {
    it('should return inventory valuation data', async () => {
      const filters = {
        period: 'monthly' as const
      };

      const result = await analyticsService.getInventoryValuation(filters);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      const valuation = result[0];
      expect(valuation).toHaveProperty('locationId');
      expect(valuation).toHaveProperty('locationName');
      expect(valuation).toHaveProperty('totalValue');
      expect(valuation).toHaveProperty('totalItems');
      expect(valuation).toHaveProperty('categoryBreakdown');
      expect(valuation).toHaveProperty('date');

      expect(typeof valuation.totalValue).toBe('number');
      expect(typeof valuation.totalItems).toBe('number');
      expect(Array.isArray(valuation.categoryBreakdown)).toBe(true);

      const category = valuation.categoryBreakdown[0];
      expect(category).toHaveProperty('category');
      expect(category).toHaveProperty('value');
      expect(category).toHaveProperty('itemCount');
      expect(category).toHaveProperty('percentage');
    });

    it('should filter by location IDs', async () => {
      // First get all locations to use for filtering
      const locationsResult = await db.query('SELECT id FROM locations LIMIT 1');
      const locationId = locationsResult.rows[0]?.id;

      if (locationId) {
        const filters = {
          locationIds: [locationId],
          period: 'monthly' as const
        };

        const result = await analyticsService.getInventoryValuation(filters);

        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].locationId).toBe(locationId);
      }
    });
  });

  describe('Inventory Turnover', () => {
    it('should return inventory turnover data', async () => {
      const filters = {
        period: 'monthly' as const
      };

      const result = await analyticsService.getInventoryTurnover(filters);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        const turnover = result[0];
        expect(turnover).toHaveProperty('period');
        expect(turnover).toHaveProperty('locationId');
        expect(turnover).toHaveProperty('locationName');
        expect(turnover).toHaveProperty('turnoverRatio');
        expect(turnover).toHaveProperty('daysOfSupply');
        expect(turnover).toHaveProperty('costOfGoodsSold');
        expect(turnover).toHaveProperty('averageInventory');

        expect(typeof turnover.turnoverRatio).toBe('number');
        expect(typeof turnover.daysOfSupply).toBe('number');
        expect(typeof turnover.costOfGoodsSold).toBe('number');
        expect(typeof turnover.averageInventory).toBe('number');
      }
    });

    it('should handle different periods', async () => {
      const dailyFilters = { period: 'daily' as const };
      const weeklyFilters = { period: 'weekly' as const };
      const monthlyFilters = { period: 'monthly' as const };

      const [daily, weekly, monthly] = await Promise.all([
        analyticsService.getInventoryTurnover(dailyFilters),
        analyticsService.getInventoryTurnover(weeklyFilters),
        analyticsService.getInventoryTurnover(monthlyFilters)
      ]);

      expect(Array.isArray(daily)).toBe(true);
      expect(Array.isArray(weekly)).toBe(true);
      expect(Array.isArray(monthly)).toBe(true);
    });
  });

  describe('Wastage Report', () => {
    it('should return wastage report data', async () => {
      const filters = {
        period: 'monthly' as const
      };

      const result = await analyticsService.getWastageReport(filters);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        const wastage = result[0];
        expect(wastage).toHaveProperty('period');
        expect(wastage).toHaveProperty('locationId');
        expect(wastage).toHaveProperty('locationName');
        expect(wastage).toHaveProperty('totalWastage');
        expect(wastage).toHaveProperty('wastageValue');
        expect(wastage).toHaveProperty('wastagePercentage');
        expect(wastage).toHaveProperty('topWastedItems');

        expect(typeof wastage.totalWastage).toBe('number');
        expect(typeof wastage.wastageValue).toBe('number');
        expect(typeof wastage.wastagePercentage).toBe('number');
        expect(Array.isArray(wastage.topWastedItems)).toBe(true);

        if (wastage.topWastedItems.length > 0) {
          const item = wastage.topWastedItems[0];
          expect(item).toHaveProperty('productId');
          expect(item).toHaveProperty('productName');
          expect(item).toHaveProperty('quantity');
          expect(item).toHaveProperty('value');
          expect(item).toHaveProperty('reason');
        }
      }
    });
  });

  describe('Location Performance', () => {
    it('should return location performance data', async () => {
      const filters = {
        period: 'monthly' as const
      };

      const result = await analyticsService.getLocationPerformance(filters);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        const performance = result[0];
        expect(performance).toHaveProperty('period');
        expect(performance).toHaveProperty('locationId');
        expect(performance).toHaveProperty('locationName');
        expect(performance).toHaveProperty('revenue');
        expect(performance).toHaveProperty('costOfGoodsSold');
        expect(performance).toHaveProperty('grossProfit');
        expect(performance).toHaveProperty('grossMargin');
        expect(performance).toHaveProperty('inventoryTurnover');
        expect(performance).toHaveProperty('wastagePercentage');

        expect(typeof performance.revenue).toBe('number');
        expect(typeof performance.costOfGoodsSold).toBe('number');
        expect(typeof performance.grossProfit).toBe('number');
        expect(typeof performance.grossMargin).toBe('number');
        expect(typeof performance.inventoryTurnover).toBe('number');
        expect(typeof performance.wastagePercentage).toBe('number');
      }
    });
  });

  describe('Chart Data', () => {
    it('should return valuation chart data', async () => {
      const filters = {
        period: 'monthly' as const
      };

      const result = await analyticsService.getValuationChartData(filters);

      expect(result).toHaveProperty('labels');
      expect(result).toHaveProperty('datasets');
      expect(Array.isArray(result.labels)).toBe(true);
      expect(Array.isArray(result.datasets)).toBe(true);

      if (result.datasets.length > 0) {
        const dataset = result.datasets[0];
        expect(dataset).toHaveProperty('label');
        expect(dataset).toHaveProperty('data');
        expect(Array.isArray(dataset.data)).toBe(true);
      }
    });

    it('should return turnover chart data', async () => {
      const filters = {
        period: 'monthly' as const
      };

      const result = await analyticsService.getTurnoverChartData(filters);

      expect(result).toHaveProperty('labels');
      expect(result).toHaveProperty('datasets');
      expect(Array.isArray(result.labels)).toBe(true);
      expect(Array.isArray(result.datasets)).toBe(true);
    });

    it('should return wastage chart data', async () => {
      const filters = {
        period: 'monthly' as const
      };

      const result = await analyticsService.getWastageChartData(filters);

      expect(result).toHaveProperty('labels');
      expect(result).toHaveProperty('datasets');
      expect(Array.isArray(result.labels)).toBe(true);
      expect(Array.isArray(result.datasets)).toBe(true);
    });

    it('should return performance chart data', async () => {
      const filters = {
        period: 'monthly' as const
      };

      const result = await analyticsService.getPerformanceChartData(filters);

      expect(result).toHaveProperty('labels');
      expect(result).toHaveProperty('datasets');
      expect(Array.isArray(result.labels)).toBe(true);
      expect(Array.isArray(result.datasets)).toBe(true);
    });
  });

  describe('Cache Management', () => {
    it('should cache results', async () => {
      const filters = {
        period: 'monthly' as const
      };

      // First call
      const start1 = Date.now();
      await analyticsService.getInventoryValuation(filters);
      const duration1 = Date.now() - start1;

      // Second call (should be cached)
      const start2 = Date.now();
      await analyticsService.getInventoryValuation(filters);
      const duration2 = Date.now() - start2;

      // Second call should be faster (cached)
      expect(duration2).toBeLessThanOrEqual(duration1);
    });

    it('should invalidate cache', async () => {
      const filters = {
        period: 'monthly' as const
      };

      // Get data to populate cache
      await analyticsService.getInventoryValuation(filters);

      // Invalidate cache
      await analyticsService.invalidateAnalyticsCache();

      // Get data again (should not be cached)
      const result = await analyticsService.getInventoryValuation(filters);
      expect(result).toBeDefined();
    });
  });
});