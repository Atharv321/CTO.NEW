const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const servicesRoutes = require('./src/routes/services');
const barbersRoutes = require('./src/routes/barbers');
const availabilityRoutes = require('./src/routes/availability');
const bookingsRoutes = require('./src/routes/bookings');
const categoriesRouter = require('./src/routes/categories');
const itemsRouter = require('./src/routes/items');
const stockRouter = require('./src/routes/stock');
const {
  receiveStock,
  consumeStock,
  adjustStock,
  getStockMovements,
  getAuditLogs,
  getLowStockItems,
  computeLowStockThreshold,
  getInventoryStatus,
} = require('./src/stock-workflows');
const authRoutes = require('./routes/auth');
const suppliersRouter = require('./src/routes/suppliers');
const purchaseOrdersRouter = require('./src/routes/purchaseOrders');
const itemsRouter = require('./src/routes/items');
const locationsRouter = require('./src/routes/locations');

const createApp = () => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check
  // Routes
  app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/admin/services', servicesRoutes);
  app.use('/api/admin/barbers', barbersRoutes);
  app.use('/api/admin/availability', availabilityRoutes);
  app.use('/api/admin/bookings', bookingsRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not found',
      message: 'The requested endpoint does not exist',
    });
  app.use('/api/categories', categoriesRouter);
  app.use('/api/items', itemsRouter);
  app.use('/api/stock', stockRouter);
  app.post('/api/stock/receive', async (req, res) => {
    try {
      const { itemId, barcode, locationId, quantity, reason, userId, barcodeReference, metadata } = req.body;

      if ((!itemId && !barcode) || !locationId || quantity === undefined) {
        return res.status(400).json({
          error: 'Missing required fields: itemId or barcode, locationId, and quantity are required',
        });
      }

      const result = await receiveStock({
        itemId,
        barcode,
        locationId,
        quantity: Number(quantity),
        reason,
        userId,
        barcodeReference,
        metadata,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(201).json({
        success: true,
        ...result,
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
      });
    }
  });

  app.post('/api/stock/consume', async (req, res) => {
    try {
      const { itemId, barcode, locationId, quantity, reason, userId, barcodeReference, metadata } = req.body;

      if ((!itemId && !barcode) || !locationId || quantity === undefined) {
        return res.status(400).json({
          error: 'Missing required fields: itemId or barcode, locationId, and quantity are required',
        });
      }

      const result = await consumeStock({
        itemId,
        barcode,
        locationId,
        quantity: Number(quantity),
        reason,
        userId,
        barcodeReference,
        metadata,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(201).json({
        success: true,
        ...result,
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
      });
    }
  });

  app.post('/api/stock/adjust', async (req, res) => {
    try {
      const { itemId, barcode, locationId, quantity, reason, userId, barcodeReference, metadata } = req.body;

      if ((!itemId && !barcode) || !locationId || quantity === undefined) {
        return res.status(400).json({
          error: 'Missing required fields: itemId or barcode, locationId, and quantity are required',
        });
      }

      const result = await adjustStock({
        itemId,
        barcode,
        locationId,
        quantity: Number(quantity),
        reason,
        userId,
        barcodeReference,
        metadata,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(201).json({
        success: true,
        ...result,
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
      });
    }
  });

  app.get('/api/stock/movements', async (req, res) => {
    try {
      const { itemId, locationId, movementType, limit, since } = req.query;

      const movements = await getStockMovements({
        itemId,
        locationId,
        movementType,
        limit: limit ? Number(limit) : undefined,
        since,
      });

      res.json({
        movements,
        count: movements.length,
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

  app.get('/api/audit-logs', async (req, res) => {
    try {
      const { entityType, entityId, userId, limit, since } = req.query;

      const logs = await getAuditLogs({
        entityType,
        entityId,
        userId,
        limit: limit ? Number(limit) : undefined,
        since,
      });

      res.json({
        logs,
        count: logs.length,
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

  app.get('/api/stock/low-stock', async (req, res) => {
    try {
      const { locationId } = req.query;

      const lowStockItems = await getLowStockItems({ locationId });

      res.json({
        items: lowStockItems,
        count: lowStockItems.length,
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

  app.post('/api/stock/threshold/compute', async (req, res) => {
    try {
      const { reorderPoint, leadTime, safetyStock } = req.body;

      const threshold = computeLowStockThreshold({
        reorderPoint: reorderPoint ? Number(reorderPoint) : undefined,
        leadTime: leadTime ? Number(leadTime) : undefined,
        safetyStock: safetyStock ? Number(safetyStock) : undefined,
      });

      res.json({
        threshold,
        parameters: {
          reorderPoint: reorderPoint || 10,
          leadTime: leadTime || 0,
          safetyStock: safetyStock || 0,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

  app.get('/api/inventory/status', async (req, res) => {
    try {
      const { locationId } = req.query;

      const inventory = await getInventoryStatus({ locationId });

      res.json({
        inventory,
        count: inventory.length,
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });
  // Analytics endpoints
  app.get('/api/analytics/summary', (req, res) => {
    // Mock data for dashboard summary
    res.json({
      lowStockCount: 12,
      totalValuation: 45890.50,
      totalItems: 156,
      totalUnits: 1247,
      lastUpdated: new Date().toISOString()
    });
  });

  app.get('/api/analytics/turnover', (req, res) => {
    // Mock data for turnover chart (last 12 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const turnoverData = months.map((month, index) => ({
      month,
      turnover: Math.floor(Math.random() * 50000) + 20000,
      itemsSold: Math.floor(Math.random() * 100) + 50
    }));
    
    res.json(turnoverData);
  });

  app.get('/api/analytics/stock-levels', (req, res) => {
    // Mock data for stock levels
    res.json([
      { category: 'Electronics', currentStock: 45, minStock: 20, maxStock: 100 },
      { category: 'Tools', currentStock: 8, minStock: 15, maxStock: 50 },
      { category: 'Office Supplies', currentStock: 67, minStock: 30, maxStock: 80 },
      { category: 'Hardware', currentStock: 23, minStock: 25, maxStock: 60 },
      { category: 'Materials', currentStock: 89, minStock: 40, maxStock: 120 }
    ]);
  });

  app.get('/api/analytics/alerts', (req, res) => {
    // Mock data for alerts
    res.json([
      {
        id: '1',
        type: 'low_stock',
        severity: 'high',
        message: 'Tools category is critically low on stock',
        category: 'Tools',
        currentStock: 8,
        minStock: 15,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        type: 'low_stock',
        severity: 'medium',
        message: 'Hardware category running low on inventory',
        category: 'Hardware',
        currentStock: 23,
        minStock: 25,
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        type: 'valuation',
        severity: 'info',
        message: 'Monthly valuation increased by 12%',
        category: 'General',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ]);
  });
  // Auth routes
  app.use('/api/auth', authRoutes);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    });
  });
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
  });
  // API routes
  app.use('/api/items', itemsRouter);
  app.use('/api/locations', locationsRouter);
  app.use('/api/suppliers', suppliersRouter);
  app.use('/api/purchase-orders', purchaseOrdersRouter);

  return app;
};

const app = createApp();

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  
  // Run migrations before starting server
  const { runMigrations } = require('./src/db/migrations');
  
  runMigrations()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`API server listening on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error('Failed to start server:', error);
      process.exit(1);
    });
}

module.exports = app;