const express = require('express');
const LowStockService = require('../services/lowStock');

const router = express.Router();
const lowStockService = new LowStockService();

// GET /api/stock/low-stock/notifications - Generate low stock notifications
router.get('/notifications', async (req, res) => {
  try {
    const locationId = req.query.locationId || null;
    const result = await lowStockService.generateLowStockNotifications(locationId);
    res.json(result);
  } catch (error) {
    console.error('Generate notifications error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/stock/low-stock/approaching - Get items approaching low stock
router.get('/approaching', async (req, res) => {
  try {
    const locationId = req.query.locationId || null;
    const daysAhead = parseInt(req.query.daysAhead) || 7;
    
    const result = await lowStockService.getItemsApproachingLowStock(locationId, daysAhead);
    res.json(result);
  } catch (error) {
    console.error('Get approaching low stock error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/stock/low-stock/health - Get stock health metrics
router.get('/health', async (req, res) => {
  try {
    const locationId = req.query.locationId || null;
    const result = await lowStockService.getStockHealthMetrics(locationId);
    res.json(result);
  } catch (error) {
    console.error('Get stock health error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/stock/low-stock/top-consumers - Get top consuming products
router.get('/top-consumers', async (req, res) => {
  try {
    const locationId = req.query.locationId || null;
    const days = parseInt(req.query.days) || 30;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await lowStockService.getTopConsumingProducts(locationId, days, limit);
    res.json(result);
  } catch (error) {
    console.error('Get top consumers error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/stock/low-stock/slow-moving - Get slow moving inventory
router.get('/slow-moving', async (req, res) => {
  try {
    const locationId = req.query.locationId || null;
    const days = parseInt(req.query.days) || 90;
    
    const result = await lowStockService.getSlowMovingInventory(locationId, days);
    res.json(result);
  } catch (error) {
    console.error('Get slow moving inventory error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;