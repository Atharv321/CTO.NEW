const express = require('express');
const cors = require('cors');
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

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
  });

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
