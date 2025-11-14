const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

// Import routes
const authRoutesNew = require('./src/routes/authRoutes');
const authRoutesLegacy = require('./routes/auth');
const protectedRoutesDemo = require('./src/routes/protected-sample');
const bookingsRouter = require('./src/routes/bookings');
const notificationsRouter = require('./src/routes/notifications');
const servicesRoutes = require('./src/routes/services');
const barbersRoutes = require('./src/routes/barbers');
const availabilityRoutes = require('./src/routes/availability');
const categoriesRouter = require('./src/routes/categories');
const itemsRouter = require('./src/routes/items');
const stockRouter = require('./src/routes/stock');
const suppliersRouter = require('./src/routes/suppliers');
const purchaseOrdersRouter = require('./src/routes/purchaseOrders');
const locationsRouter = require('./src/routes/locations');
const customersRouter = require('./routes/customers');
const servicesRouterLegacy = require('./routes/services');
const barbersRouterLegacy = require('./routes/barbers');
const bookingsRouterLegacy = require('./routes/bookings');

// Import middleware
const { apiLimiter } = require('./middleware/rateLimiting');
const { injectUserContext } = require('./middleware/auth');

// Import Swagger
const swaggerSpec = require('./swagger');

// Import stock workflows
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

const createApp = async () => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Inject user context to all requests
  app.use(injectUserContext);

  // Apply rate limiting to all API routes
  app.use('/api', apiLimiter);

  // Swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // API documentation endpoint
  app.get('/api', (req, res) => {
    res.json({
      message: 'Barber Booking API',
      version: '1.0.0',
      documentation: '/api-docs',
      endpoints: {
        auth: '/api/auth',
        bookings: '/api/bookings',
        services: '/api/services',
        barbers: '/api/barbers',
      },
    });
  });

  // Auth routes (new with JWT and RBAC)
  app.use('/api/auth', authRoutesNew);

  // Protected routes demo (with RBAC)
  app.use('/api/protected', protectedRoutesDemo);

  // Legacy auth routes (for backward compatibility)
  app.use('/api/legacy/auth', authRoutesLegacy);

  // Booking management routes
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/notifications', notificationsRouter);

  // Admin service routes
  app.use('/api/admin/services', servicesRoutes);
  app.use('/api/admin/barbers', barbersRoutes);
  app.use('/api/admin/availability', availabilityRoutes);
  app.use('/api/admin/bookings', bookingsRouter);

  // Inventory management routes
  app.use('/api/categories', categoriesRouter);
  app.use('/api/items', itemsRouter);
  app.use('/api/stock', stockRouter);
  app.use('/api/suppliers', suppliersRouter);
  app.use('/api/purchase-orders', purchaseOrdersRouter);
  app.use('/api/locations', locationsRouter);

  // Stock operation endpoints
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
    res.json({
      lowStockCount: 12,
      totalValuation: 45890.50,
      totalItems: 156,
      totalUnits: 1247,
      lastUpdated: new Date().toISOString()
    });
  });

  app.get('/api/analytics/turnover', (req, res) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const turnoverData = months.map((month) => ({
      month,
      turnover: Math.floor(Math.random() * 50000) + 20000,
      itemsSold: Math.floor(Math.random() * 100) + 50
    }));
    
    res.json(turnoverData);
  });

  app.get('/api/analytics/stock-levels', (req, res) => {
    res.json([
      { category: 'Electronics', currentStock: 45, minStock: 20, maxStock: 100 },
      { category: 'Tools', currentStock: 8, minStock: 15, maxStock: 50 },
      { category: 'Office Supplies', currentStock: 67, minStock: 30, maxStock: 80 },
      { category: 'Hardware', currentStock: 23, minStock: 25, maxStock: 60 },
      { category: 'Materials', currentStock: 89, minStock: 40, maxStock: 120 }
    ]);
  });

  app.get('/api/analytics/alerts', (req, res) => {
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

  // Legacy routes (for backward compatibility)
  app.use('/api/services', servicesRouterLegacy);
  app.use('/api/barbers', barbersRouterLegacy);
  app.use('/api/customers', customersRouter);
  app.use('/api/bookings', bookingsRouterLegacy);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not found',
      message: 'The requested endpoint does not exist',
    });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
      error: err.name || 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    });
  });

  return app;
};

const startServer = async () => {
  const app = await createApp();
  
  const PORT = process.env.PORT || 3001;
  
  app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API documentation: http://localhost:${PORT}/api-docs`);
    console.log(`REST API base: http://localhost:${PORT}/api`);
  });
};

if (require.main === module) {
  startServer().catch(console.error);
}

module.exports = { createApp };
