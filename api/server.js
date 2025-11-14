const express = require('express');
const cors = require('cors');

const createApp = () => {
  const app = express();

  app.use(cors());
  app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
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
