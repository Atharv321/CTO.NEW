const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const servicesRoutes = require('./src/routes/services');
const barbersRoutes = require('./src/routes/barbers');
const availabilityRoutes = require('./src/routes/availability');
const bookingsRoutes = require('./src/routes/bookings');

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check
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
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    });
  });

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
