const express = require('express');
const cors = require('cors');
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

  // Routes
  app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
  });

  // Auth routes
  app.use('/api/auth', authRoutes);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  // Error handler
  app.use((err, req, res, next) => {
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
  app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });
}

module.exports = app;