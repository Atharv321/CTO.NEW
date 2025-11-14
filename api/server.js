const express = require('express');
const cors = require('cors');
const suppliersRouter = require('./src/routes/suppliers');
const purchaseOrdersRouter = require('./src/routes/purchaseOrders');
const itemsRouter = require('./src/routes/items');
const locationsRouter = require('./src/routes/locations');

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
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
