const express = require('express');
const cors = require('cors');

const createApp = () => {
  const app = express();

  app.use(cors());
  app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
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
