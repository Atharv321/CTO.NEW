const express = require('express');
const router = express.Router();
const stockService = require('../services/stockService');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validatePagination, validateStockAdjustment } = require('../middleware/validation');

router.use(authenticateToken);

router.get('/item/:itemId', async (req, res) => {
  try {
    const stock = await stockService.getStockByItem(req.params.itemId);
    res.json(stock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/item/:itemId/total', async (req, res) => {
  try {
    const summary = await stockService.getTotalStockByItem(req.params.itemId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/location/:locationId', validatePagination, async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination;
    const { search, below_reorder } = req.query;

    const filters = {};
    if (search) filters.search = search;
    if (below_reorder) filters.below_reorder = below_reorder;

    const [stock, total] = await Promise.all([
      stockService.getStockByLocation(req.params.locationId, limit, offset, filters),
      stockService.getStockCountByLocation(req.params.locationId, filters),
    ]);

    res.json({
      data: stock,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/location/:locationId/summary', async (req, res) => {
  try {
    const summary = await stockService.getLocationSummary(req.params.locationId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:itemId/:locationId', async (req, res) => {
  try {
    const stock = await stockService.getStockLevel(req.params.itemId, req.params.locationId);
    if (!stock) {
      return res.status(404).json({ error: 'Stock level not found' });
    }
    res.json(stock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:itemId/:locationId/adjust', authorize('admin', 'manager', 'operator'), validateStockAdjustment, async (req, res) => {
  try {
    const { quantity, movement_type, notes, reference_id } = req.body;
    const movement = await stockService.adjustStock(
      req.params.itemId,
      req.params.locationId,
      quantity,
      movement_type,
      req.user.id,
      notes,
      reference_id
    );
    res.json(movement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:itemId/:locationId/init', authorize('admin', 'manager'), async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity === undefined || typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ error: 'Quantity is required and must be a non-negative number' });
    }
    const stock = await stockService.createInitialStock(req.params.itemId, req.params.locationId, quantity, req.user.id);
    res.status(201).json(stock);
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

router.get('/:itemId/:locationId/history', validatePagination, async (req, res) => {
  try {
    const { limit, offset } = req.pagination;
    const movements = await stockService.getStockMovementHistory(req.params.itemId, req.params.locationId, limit, offset);
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
