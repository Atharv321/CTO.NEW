const express = require('express');
const cors = require('cors');
require('dotenv').config();

const categoriesRouter = require('./src/routes/categories');
const itemsRouter = require('./src/routes/items');
const stockRouter = require('./src/routes/stock');

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
  });

  app.use('/api/categories', categoriesRouter);
  app.use('/api/items', itemsRouter);
  app.use('/api/stock', stockRouter);

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
