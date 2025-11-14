const express = require('express');
const cors = require('cors');
const stockRoutes = require('./routes/stock');

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
  });

  // API routes
  app.use('/api/stock', stockRoutes);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'Stock Management API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        stock: '/api/stock',
        documentation: '/api/stock/docs'
      }
    });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.originalUrl}`
    });
  });

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
