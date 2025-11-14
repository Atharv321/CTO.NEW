const express = require('express');
const path = require('path');

const createApp = () => {
  const app = express();
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
  });

  app.get('/config.js', (req, res) => {
    res.type('application/javascript');
    res.send(`window.__CONFIG__ = { API_BASE_URL: '${API_BASE_URL}' };`);
  });

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  return app;
};

const app = createApp();

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Web server listening on port ${PORT}`);
  });
}

module.exports = app;
