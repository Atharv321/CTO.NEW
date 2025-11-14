import { Router, Request, Response } from 'express';
import { stockService } from '../services/stockService';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Get stock level for item at location
router.get('/item/:itemId/location/:locationId', authenticate, async (req: Request, res: Response) => {
  try {
    const stockLevel = await stockService.getStockLevel(req.params.itemId, req.params.locationId);

    if (!stockLevel) {
      return res.status(404).json({ error: 'Stock level not found' });
    }

    res.json(stockLevel);
  } catch (error) {
    console.error('Error fetching stock level:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all stock for an item across locations
router.get('/item/:itemId', authenticate, async (req: Request, res: Response) => {
  try {
    const stockLevels = await stockService.getItemStockByLocation(req.params.itemId);

    res.json(stockLevels);
  } catch (error) {
    console.error('Error fetching item stock:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all stock at a location
router.get('/location/:locationId', authenticate, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const offset = (page - 1) * limit;

    const result = await stockService.getLocationStock(req.params.locationId, { page, limit, offset });

    res.json(result);
  } catch (error) {
    console.error('Error fetching location stock:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get low stock items at location
router.get('/location/:locationId/low-stock', authenticate, async (req: Request, res: Response) => {
  try {
    const lowStockItems = await stockService.getLowStockItems(req.params.locationId);

    res.json(lowStockItems);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update stock level
router.post(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  validateRequest([
    { field: 'itemId', type: 'uuid', required: true },
    { field: 'locationId', type: 'uuid', required: true },
    { field: 'quantity', type: 'number', required: true },
    { field: 'reorderLevel', type: 'number' },
  ]),
  async (req: Request, res: Response) => {
    try {
      const stockLevel = await stockService.createOrUpdateStockLevel({
        itemId: req.body.itemId,
        locationId: req.body.locationId,
        quantity: req.body.quantity,
        reorderLevel: req.body.reorderLevel,
      });

      res.status(201).json(stockLevel);
    } catch (error: any) {
      if (error.code === '23503') {
        // Foreign key constraint violation
        return res.status(400).json({ error: 'Referenced item or location does not exist' });
      }
      console.error('Error creating/updating stock level:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Adjust stock level
router.post(
  '/adjust',
  authenticate,
  authorize('admin', 'manager', 'viewer'),
  validateRequest([
    { field: 'itemId', type: 'uuid', required: true },
    { field: 'locationId', type: 'uuid', required: true },
    { field: 'adjustment', type: 'number', required: true },
    { field: 'reason', type: 'string', required: true },
    { field: 'notes', type: 'string' },
  ]),
  async (req: Request, res: Response) => {
    try {
      const validReasons = ['scanned_entry', 'manual_adjustment', 'correction', 'count_variance'];
      if (!validReasons.includes(req.body.reason)) {
        return res.status(400).json({ error: 'Invalid adjustment reason' });
      }

      const result = await stockService.adjustStock({
        itemId: req.body.itemId,
        locationId: req.body.locationId,
        adjustment: req.body.adjustment,
        reason: req.body.reason,
        notes: req.body.notes,
        adjustedBy: req.user?.id || 'system',
      });

      res.status(201).json(result);
    } catch (error: any) {
      if (error.code === '23503') {
        // Foreign key constraint violation
        return res.status(400).json({ error: 'Referenced item or location does not exist' });
      }
      console.error('Error adjusting stock:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get adjustment history
router.get('/adjustments/:itemId/:locationId', authenticate, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const offset = (page - 1) * limit;

    const result = await stockService.getAdjustmentHistory(
      req.params.itemId,
      req.params.locationId,
      { page, limit, offset }
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching adjustment history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
