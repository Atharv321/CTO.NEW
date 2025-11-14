import { Router, Response } from 'express';
import { AnalyticsFilters } from '@shared/types';
import analyticsService from '../services/analytics.js';
import { authenticateToken, requireAnalyticsAccess, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Apply authentication to all analytics routes
router.use(authenticateToken);
router.use(requireAnalyticsAccess);

// Inventory Valuation
router.get('/valuation', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters: AnalyticsFilters = {
      locationIds: req.query.locationIds ? (req.query.locationIds as string).split(',') : undefined,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      period: req.query.period as 'daily' | 'weekly' | 'monthly' || 'monthly'
    };

    const data = await analyticsService.getInventoryValuation(filters);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching inventory valuation:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch inventory valuation' });
  }
});

// Inventory Turnover
router.get('/turnover', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters: AnalyticsFilters = {
      locationIds: req.query.locationIds ? (req.query.locationIds as string).split(',') : undefined,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      period: req.query.period as 'daily' | 'weekly' | 'monthly' || 'monthly'
    };

    const data = await analyticsService.getInventoryTurnover(filters);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching inventory turnover:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch inventory turnover' });
  }
});

// Wastage Report
router.get('/wastage', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters: AnalyticsFilters = {
      locationIds: req.query.locationIds ? (req.query.locationIds as string).split(',') : undefined,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      period: req.query.period as 'daily' | 'weekly' | 'monthly' || 'monthly'
    };

    const data = await analyticsService.getWastageReport(filters);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching wastage report:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch wastage report' });
  }
});

// Location Performance
router.get('/performance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters: AnalyticsFilters = {
      locationIds: req.query.locationIds ? (req.query.locationIds as string).split(',') : undefined,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      period: req.query.period as 'daily' | 'weekly' | 'monthly' || 'monthly'
    };

    const data = await analyticsService.getLocationPerformance(filters);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching location performance:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch location performance' });
  }
});

// Chart Data Endpoints
router.get('/charts/valuation', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters: AnalyticsFilters = {
      locationIds: req.query.locationIds ? (req.query.locationIds as string).split(',') : undefined,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      period: req.query.period as 'daily' | 'weekly' | 'monthly' || 'monthly'
    };

    const data = await analyticsService.getValuationChartData(filters);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching valuation chart data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch valuation chart data' });
  }
});

router.get('/charts/turnover', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters: AnalyticsFilters = {
      locationIds: req.query.locationIds ? (req.query.locationIds as string).split(',') : undefined,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      period: req.query.period as 'daily' | 'weekly' | 'monthly' || 'monthly'
    };

    const data = await analyticsService.getTurnoverChartData(filters);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching turnover chart data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch turnover chart data' });
  }
});

router.get('/charts/wastage', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters: AnalyticsFilters = {
      locationIds: req.query.locationIds ? (req.query.locationIds as string).split(',') : undefined,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      period: req.query.period as 'daily' | 'weekly' | 'monthly' || 'monthly'
    };

    const data = await analyticsService.getWastageChartData(filters);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching wastage chart data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch wastage chart data' });
  }
});

router.get('/charts/performance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters: AnalyticsFilters = {
      locationIds: req.query.locationIds ? (req.query.locationIds as string).split(',') : undefined,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      period: req.query.period as 'daily' | 'weekly' | 'monthly' || 'monthly'
    };

    const data = await analyticsService.getPerformanceChartData(filters);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching performance chart data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch performance chart data' });
  }
});

// Cache Management
router.post('/cache/clear', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await analyticsService.invalidateAnalyticsCache();
    res.json({ success: true, message: 'Analytics cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing analytics cache:', error);
    res.status(500).json({ success: false, error: 'Failed to clear analytics cache' });
  }
});

export default router;