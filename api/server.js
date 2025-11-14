const express = require('express');
const cors = require('cors');
require('dotenv').config();

const bookingsRouter = require('./src/routes/bookings');
const notificationsRouter = require('./src/routes/notifications');

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  
  app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
  });

  app.use('/api/bookings', bookingsRouter);
  app.use('/api/notifications', notificationsRouter);

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
