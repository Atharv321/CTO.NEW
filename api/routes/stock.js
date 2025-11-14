const express = require('express');
const StockService = require('../services/stock');
const lowStockRoutes = require('./lowStock');

const router = express.Router();
const stockService = new StockService();

// Include low stock routes
router.use('/low-stock', lowStockRoutes);

// Middleware to extract user information from request
const extractUserInfo = (req) => {
  return {
    userId: req.user?.id || req.headers['x-user-id'] || 'anonymous',
    userName: req.user?.name || req.headers['x-user-name'] || 'Anonymous User',
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  };
};

// Stock movement endpoints

// POST /api/stock/receive - Receive stock into inventory
router.post('/receive', async (req, res) => {
  try {
    const userInfo = extractUserInfo(req);
    const movementData = {
      ...req.body,
      userId: userInfo.userId,
      userName: userInfo.userName,
      metadata: {
        ipAddress: userInfo.ipAddress,
        userAgent: userInfo.userAgent,
        ...req.body.metadata
      }
    };

    const result = await stockService.receiveStock(movementData);
    res.status(201).json(result);
  } catch (error) {
    console.error('Receive stock error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/stock/consume - Consume stock from inventory
router.post('/consume', async (req, res) => {
  try {
    const userInfo = extractUserInfo(req);
    const movementData = {
      ...req.body,
      userId: userInfo.userId,
      userName: userInfo.userName,
      metadata: {
        ipAddress: userInfo.ipAddress,
        userAgent: userInfo.userAgent,
        ...req.body.metadata
      }
    };

    const result = await stockService.consumeStock(movementData);
    res.status(201).json(result);
  } catch (error) {
    console.error('Consume stock error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/stock/adjust - Adjust stock quantity
router.post('/adjust', async (req, res) => {
  try {
    const userInfo = extractUserInfo(req);
    const movementData = {
      ...req.body,
      userId: userInfo.userId,
      userName: userInfo.userName,
      metadata: {
        ipAddress: userInfo.ipAddress,
        userAgent: userInfo.userAgent,
        ...req.body.metadata
      }
    };

    const result = await stockService.adjustStock(movementData);
    res.status(201).json(result);
  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/stock/history - Get stock movement history
router.get('/history', async (req, res) => {
  try {
    const filters = {
      productId: req.query.productId,
      locationId: req.query.locationId,
      movementType: req.query.movementType,
      startDate: req.query.startDate ? new Date(req.query.startDate) : null,
      endDate: req.query.endDate ? new Date(req.query.endDate) : null,
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0
    };

    const result = await stockService.getStockHistory(filters);
    res.json(result);
  } catch (error) {
    console.error('Get stock history error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/stock/inventory - Get inventory levels
router.get('/inventory', async (req, res) => {
  try {
    const { productId, locationId } = req.query;

    if (productId && locationId) {
      // Get specific inventory item
      const result = await stockService.getInventory(productId, locationId);
      res.json(result);
    } else {
      // Get all inventory with pagination
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;
      const result = await stockService.getAllInventory(limit, offset);
      res.json(result);
    }
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Low stock endpoints

// GET /api/stock/low-stock - Get low stock alerts
router.get('/low-stock', async (req, res) => {
  try {
    const locationId = req.query.locationId || null;
    const result = await stockService.getLowStockAlerts(locationId);
    res.json(result);
  } catch (error) {
    console.error('Get low stock alerts error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/stock/low-stock/threshold - Update low stock threshold
router.put('/low-stock/threshold', async (req, res) => {
  try {
    const userInfo = extractUserInfo(req);
    const { productId, locationId, threshold } = req.body;

    if (!productId || !locationId || threshold === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Product ID, location ID, and threshold are required'
      });
    }

    const result = await stockService.updateLowStockThreshold(
      productId, locationId, threshold, userInfo.userId, userInfo.userName
    );
    res.json(result);
  } catch (error) {
    console.error('Update low stock threshold error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Audit log endpoints

// GET /api/stock/audit - Get audit log
router.get('/audit', async (req, res) => {
  try {
    const filters = {
      tableName: req.query.tableName,
      recordId: req.query.recordId,
      action: req.query.action,
      userId: req.query.userId,
      startDate: req.query.startDate ? new Date(req.query.startDate) : null,
      endDate: req.query.endDate ? new Date(req.query.endDate) : null,
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0
    };

    const result = await stockService.getAuditLog(filters);
    res.json(result);
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Product endpoints

// POST /api/stock/products - Create a new product
router.post('/products', async (req, res) => {
  try {
    const result = await stockService.createProduct(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/stock/products/:id - Get product by ID
router.get('/products/:id', async (req, res) => {
  try {
    const result = await stockService.getProduct(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/stock/products - Get all products
router.get('/products', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const result = await stockService.getProducts(limit, offset);
    res.json(result);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Location endpoints

// POST /api/stock/locations - Create a new location
router.post('/locations', async (req, res) => {
  try {
    const result = await stockService.createLocation(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Create location error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/stock/locations/:id - Get location by ID
router.get('/locations/:id', async (req, res) => {
  try {
    const result = await stockService.getLocation(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Get location error:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/stock/locations - Get all locations
router.get('/locations', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const result = await stockService.getLocations(limit, offset);
    res.json(result);
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Unhandled error in stock routes:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

module.exports = router;