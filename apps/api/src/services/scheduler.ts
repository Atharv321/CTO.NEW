import * as cron from 'node-cron';
import analyticsService from './analytics.js';
import db from '../database/connection.js';
import cacheService from './cache.js';

export class SchedulerService {
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  async initialize() {
    console.log('Initializing analytics scheduler...');

    // Daily snapshot at 2 AM
    this.scheduleTask('daily-snapshot', '0 2 * * *', async () => {
      await this.generateDailySnapshot();
    });

    // Weekly snapshot on Sunday at 3 AM
    this.scheduleTask('weekly-snapshot', '0 3 * * 0', async () => {
      await this.generateWeeklySnapshot();
    });

    // Monthly snapshot on 1st day at 4 AM
    this.scheduleTask('monthly-snapshot', '0 4 1 * *', async () => {
      await this.generateMonthlySnapshot();
    });

    // Cache cleanup every hour
    this.scheduleTask('cache-cleanup', '0 * * * *', async () => {
      await this.cleanupExpiredCache();
    });

    console.log('Scheduler initialized with tasks:', Array.from(this.tasks.keys()));
  }

  private scheduleTask(name: string, schedule: string, task: () => Promise<void>) {
    if (this.tasks.has(name)) {
      this.tasks.get(name)?.stop();
    }

    const scheduledTask = cron.schedule(schedule, task, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.tasks.set(name, scheduledTask);
    scheduledTask.start();

    console.log(`Scheduled task '${name}' with cron: ${schedule}`);
  }

  async generateDailySnapshot() {
    try {
      console.log('Generating daily analytics snapshot...');
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const startDate = yesterday.toISOString().split('T')[0];
      const endDate = startDate;

      const locations = await db.query('SELECT id FROM locations WHERE is_active = true');
      
      for (const location of locations.rows) {
        const filters = {
          locationIds: [location.id],
          startDate,
          endDate,
          period: 'daily' as const
        };

        const [valuation, turnover, wastage, performance] = await Promise.all([
          analyticsService.getInventoryValuation(filters),
          analyticsService.getInventoryTurnover(filters),
          analyticsService.getWastageReport(filters),
          analyticsService.getLocationPerformance(filters)
        ]);

        // Store snapshot in database
        const valuationData = valuation[0];
        const turnoverData = turnover[0];
        const wastageData = wastage[0];
        const performanceData = performance[0];

        await db.query(`
          INSERT INTO analytics_snapshots (
            location_id, period_type, period_start, period_end,
            total_inventory_value, total_items, turnover_ratio,
            wastage_value, wastage_percentage, revenue, cost_of_goods_sold
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (location_id, period_type, period_start)
          DO UPDATE SET
            total_inventory_value = EXCLUDED.total_inventory_value,
            total_items = EXCLUDED.total_items,
            turnover_ratio = EXCLUDED.turnover_ratio,
            wastage_value = EXCLUDED.wastage_value,
            wastage_percentage = EXCLUDED.wastage_percentage,
            revenue = EXCLUDED.revenue,
            cost_of_goods_sold = EXCLUDED.cost_of_goods_sold,
            created_at = CURRENT_TIMESTAMP
        `, [
          location.id,
          'daily',
          startDate,
          endDate,
          valuationData?.totalValue || 0,
          valuationData?.totalItems || 0,
          turnoverData?.turnoverRatio || 0,
          wastageData?.wastageValue || 0,
          wastageData?.wastagePercentage || 0,
          performanceData?.revenue || 0,
          performanceData?.costOfGoodsSold || 0
        ]);
      }

      console.log('Daily snapshot generated successfully');
    } catch (error) {
      console.error('Error generating daily snapshot:', error);
    }
  }

  async generateWeeklySnapshot() {
    try {
      console.log('Generating weekly analytics snapshot...');
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const locations = await db.query('SELECT id FROM locations WHERE is_active = true');
      
      for (const location of locations.rows) {
        const filters = {
          locationIds: [location.id],
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          period: 'weekly' as const
        };

        const [valuation, turnover, wastage, performance] = await Promise.all([
          analyticsService.getInventoryValuation(filters),
          analyticsService.getInventoryTurnover(filters),
          analyticsService.getWastageReport(filters),
          analyticsService.getLocationPerformance(filters)
        ]);

        const valuationData = valuation[0];
        const turnoverData = turnover[0];
        const wastageData = wastage[0];
        const performanceData = performance[0];

        await db.query(`
          INSERT INTO analytics_snapshots (
            location_id, period_type, period_start, period_end,
            total_inventory_value, total_items, turnover_ratio,
            wastage_value, wastage_percentage, revenue, cost_of_goods_sold
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (location_id, period_type, period_start)
          DO UPDATE SET
            total_inventory_value = EXCLUDED.total_inventory_value,
            total_items = EXCLUDED.total_items,
            turnover_ratio = EXCLUDED.turnover_ratio,
            wastage_value = EXCLUDED.wastage_value,
            wastage_percentage = EXCLUDED.wastage_percentage,
            revenue = EXCLUDED.revenue,
            cost_of_goods_sold = EXCLUDED.cost_of_goods_sold,
            created_at = CURRENT_TIMESTAMP
        `, [
          location.id,
          'weekly',
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          valuationData?.totalValue || 0,
          valuationData?.totalItems || 0,
          turnoverData?.turnoverRatio || 0,
          wastageData?.wastageValue || 0,
          wastageData?.wastagePercentage || 0,
          performanceData?.revenue || 0,
          performanceData?.costOfGoodsSold || 0
        ]);
      }

      console.log('Weekly snapshot generated successfully');
    } catch (error) {
      console.error('Error generating weekly snapshot:', error);
    }
  }

  async generateMonthlySnapshot() {
    try {
      console.log('Generating monthly analytics snapshot...');
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      const locations = await db.query('SELECT id FROM locations WHERE is_active = true');
      
      for (const location of locations.rows) {
        const filters = {
          locationIds: [location.id],
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          period: 'monthly' as const
        };

        const [valuation, turnover, wastage, performance] = await Promise.all([
          analyticsService.getInventoryValuation(filters),
          analyticsService.getInventoryTurnover(filters),
          analyticsService.getWastageReport(filters),
          analyticsService.getLocationPerformance(filters)
        ]);

        const valuationData = valuation[0];
        const turnoverData = turnover[0];
        const wastageData = wastage[0];
        const performanceData = performance[0];

        await db.query(`
          INSERT INTO analytics_snapshots (
            location_id, period_type, period_start, period_end,
            total_inventory_value, total_items, turnover_ratio,
            wastage_value, wastage_percentage, revenue, cost_of_goods_sold
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (location_id, period_type, period_start)
          DO UPDATE SET
            total_inventory_value = EXCLUDED.total_inventory_value,
            total_items = EXCLUDED.total_items,
            turnover_ratio = EXCLUDED.turnover_ratio,
            wastage_value = EXCLUDED.wastage_value,
            wastage_percentage = EXCLUDED.wastage_percentage,
            revenue = EXCLUDED.revenue,
            cost_of_goods_sold = EXCLUDED.cost_of_goods_sold,
            created_at = CURRENT_TIMESTAMP
        `, [
          location.id,
          'monthly',
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          valuationData?.totalValue || 0,
          valuationData?.totalItems || 0,
          turnoverData?.turnoverRatio || 0,
          wastageData?.wastageValue || 0,
          wastageData?.wastagePercentage || 0,
          performanceData?.revenue || 0,
          performanceData?.costOfGoodsSold || 0
        ]);
      }

      console.log('Monthly snapshot generated successfully');
    } catch (error) {
      console.error('Error generating monthly snapshot:', error);
    }
  }

  async cleanupExpiredCache() {
    try {
      console.log('Cleaning up expired cache entries...');
      await analyticsService.invalidateAnalyticsCache();
      console.log('Cache cleanup completed');
    } catch (error) {
      console.error('Error during cache cleanup:', error);
    }
  }

  async stopAll() {
    console.log('Stopping all scheduled tasks...');
    this.tasks.forEach((task, name) => {
      task.stop();
      console.log(`Stopped task: ${name}`);
    });
    this.tasks.clear();
  }

  // Manual trigger for testing
  async triggerSnapshot(type: 'daily' | 'weekly' | 'monthly') {
    switch (type) {
      case 'daily':
        await this.generateDailySnapshot();
        break;
      case 'weekly':
        await this.generateWeeklySnapshot();
        break;
      case 'monthly':
        await this.generateMonthlySnapshot();
        break;
    }
  }

  getActiveTasks(): string[] {
    return Array.from(this.tasks.keys());
  }
}

export const schedulerService = new SchedulerService();
export default schedulerService;