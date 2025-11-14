const request = require('supertest');
const app = require('../server');
const { resetDatabase } = require('./stock-workflows');

describe('Stock Workflows API Endpoints', () => {
  beforeEach(() => {
    resetDatabase();
  });

  describe('POST /api/stock/receive', () => {
    it('should successfully receive stock', async () => {
      const response = await request(app)
        .post('/api/stock/receive')
        .send({
          itemId: 'item-olive-oil',
          locationId: 'loc-kitchen-east',
          quantity: 15,
          reason: 'New shipment',
          userId: 'user-123',
          barcodeReference: 'SHIP-001',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.newQuantity).toBe(35);
      expect(response.body.previousQuantity).toBe(20);
      expect(response.body.difference).toBe(15);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/stock/receive')
        .send({
          itemId: 'item-olive-oil',
          quantity: 10,
        })
        .expect(400);

      expect(response.body.error).toContain('required');
    });

    it('should return 400 for invalid item', async () => {
      const response = await request(app)
        .post('/api/stock/receive')
        .send({
          itemId: 'non-existent',
          locationId: 'loc-kitchen-east',
          quantity: 10,
        })
        .expect(400);

      expect(response.body.error).toBe('Item not found');
    });
  });

  describe('POST /api/stock/consume', () => {
    it('should successfully consume stock', async () => {
      const response = await request(app)
        .post('/api/stock/consume')
        .send({
          itemId: 'item-olive-oil',
          locationId: 'loc-kitchen-east',
          quantity: 5,
          reason: 'Kitchen usage',
          userId: 'chef-456',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.newQuantity).toBe(15);
      expect(response.body.difference).toBe(-5);
    });

    it('should return 400 for insufficient inventory', async () => {
      const response = await request(app)
        .post('/api/stock/consume')
        .send({
          itemId: 'item-flour',
          locationId: 'loc-pantry-central',
          quantity: 100,
          reason: 'Attempted overconsumption',
          userId: 'user-999',
        })
        .expect(400);

      expect(response.body.error).toContain('Insufficient inventory');
    });
  });

  describe('POST /api/stock/adjust', () => {
    it('should successfully adjust stock to exact quantity', async () => {
      const response = await request(app)
        .post('/api/stock/adjust')
        .send({
          itemId: 'item-olive-oil',
          locationId: 'loc-kitchen-west',
          quantity: 30,
          reason: 'Inventory audit',
          userId: 'manager-789',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.newQuantity).toBe(30);
      expect(response.body.previousQuantity).toBe(12);
      expect(response.body.difference).toBe(18);
    });

    it('should handle downward adjustment', async () => {
      const response = await request(app)
        .post('/api/stock/adjust')
        .send({
          itemId: 'item-flour',
          locationId: 'loc-kitchen-east',
          quantity: 5,
          reason: 'Damaged goods',
          userId: 'supervisor-001',
        })
        .expect(201);

      expect(response.body.newQuantity).toBe(5);
      expect(response.body.difference).toBe(-6);
    });
  });

  describe('GET /api/stock/movements', () => {
    it('should retrieve stock movements', async () => {
      await request(app)
        .post('/api/stock/receive')
        .send({
          itemId: 'item-olive-oil',
          locationId: 'loc-kitchen-east',
          quantity: 10,
          userId: 'user-1',
        });

      await request(app)
        .post('/api/stock/consume')
        .send({
          itemId: 'item-olive-oil',
          locationId: 'loc-kitchen-east',
          quantity: 5,
          userId: 'user-2',
        });

      const response = await request(app)
        .get('/api/stock/movements')
        .query({ itemId: 'item-olive-oil' })
        .expect(200);

      expect(response.body.movements).toHaveLength(2);
      expect(response.body.count).toBe(2);
      expect(response.body.movements[0].movementType).toBe('consume');
      expect(response.body.movements[1].movementType).toBe('receive');
    });

    it('should filter movements by type', async () => {
      await request(app)
        .post('/api/stock/receive')
        .send({
          itemId: 'item-olive-oil',
          locationId: 'loc-kitchen-east',
          quantity: 10,
          userId: 'user-1',
        });

      await request(app)
        .post('/api/stock/consume')
        .send({
          itemId: 'item-olive-oil',
          locationId: 'loc-kitchen-east',
          quantity: 5,
          userId: 'user-2',
        });

      const response = await request(app)
        .get('/api/stock/movements')
        .query({ itemId: 'item-olive-oil', movementType: 'receive' })
        .expect(200);

      expect(response.body.movements).toHaveLength(1);
      expect(response.body.movements[0].movementType).toBe('receive');
    });
  });

  describe('GET /api/audit-logs', () => {
    it('should retrieve audit logs', async () => {
      await request(app)
        .post('/api/stock/receive')
        .send({
          itemId: 'item-olive-oil',
          locationId: 'loc-kitchen-east',
          quantity: 10,
          userId: 'user-alice',
        });

      const response = await request(app)
        .get('/api/audit-logs')
        .query({ userId: 'user-alice' })
        .expect(200);

      expect(response.body.logs).toHaveLength(1);
      expect(response.body.logs[0].userId).toBe('user-alice');
      expect(response.body.logs[0].action).toBe('stock_receive');
      expect(response.body.logs[0].changes).toHaveProperty('previousQuantity');
      expect(response.body.logs[0].changes).toHaveProperty('newQuantity');
    });

    it('should filter logs by entity', async () => {
      await request(app)
        .post('/api/stock/receive')
        .send({
          itemId: 'item-olive-oil',
          locationId: 'loc-kitchen-east',
          quantity: 10,
          userId: 'user-1',
        });

      await request(app)
        .post('/api/stock/consume')
        .send({
          itemId: 'item-flour',
          locationId: 'loc-kitchen-east',
          quantity: 2,
          userId: 'user-2',
        });

      const response = await request(app)
        .get('/api/audit-logs')
        .query({ entityId: 'item-olive-oil' })
        .expect(200);

      expect(response.body.logs).toHaveLength(1);
      expect(response.body.logs[0].entityId).toBe('item-olive-oil');
    });
  });

  describe('GET /api/stock/low-stock', () => {
    it('should retrieve low stock items', async () => {
      const response = await request(app).get('/api/stock/low-stock').expect(200);

      expect(response.body.items.length).toBeGreaterThan(0);
      response.body.items.forEach((item) => {
        expect(item.isLowStock).toBe(true);
        expect(item.quantity).toBeLessThan(item.lowStockThreshold);
      });
    });

    it('should filter low stock by location', async () => {
      const response = await request(app)
        .get('/api/stock/low-stock')
        .query({ locationId: 'loc-pantry-central' })
        .expect(200);

      response.body.items.forEach((item) => {
        expect(item.locationId).toBe('loc-pantry-central');
      });
    });

    it('should return items sorted by urgency', async () => {
      const response = await request(app).get('/api/stock/low-stock').expect(200);

      const items = response.body.items;
      for (let i = 1; i < items.length; i++) {
        expect(items[i - 1].unitsBelowThreshold).toBeGreaterThanOrEqual(items[i].unitsBelowThreshold);
      }
    });
  });

  describe('POST /api/stock/threshold/compute', () => {
    it('should compute low stock threshold with defaults', async () => {
      const response = await request(app).post('/api/stock/threshold/compute').send({}).expect(200);

      expect(response.body.threshold).toBe(10);
      expect(response.body.parameters.reorderPoint).toBe(10);
    });

    it('should compute threshold with custom parameters', async () => {
      const response = await request(app)
        .post('/api/stock/threshold/compute')
        .send({
          reorderPoint: 20,
          leadTime: 14,
          safetyStock: 5,
        })
        .expect(200);

      expect(response.body.threshold).toBe(29);
      expect(response.body.parameters.reorderPoint).toBe(20);
      expect(response.body.parameters.leadTime).toBe(14);
      expect(response.body.parameters.safetyStock).toBe(5);
    });
  });

  describe('GET /api/inventory/status', () => {
    it('should retrieve inventory status', async () => {
      const response = await request(app).get('/api/inventory/status').expect(200);

      expect(response.body.inventory.length).toBeGreaterThan(0);
      response.body.inventory.forEach((item) => {
        expect(item).toHaveProperty('itemId');
        expect(item).toHaveProperty('locationId');
        expect(item).toHaveProperty('quantity');
        expect(item).toHaveProperty('lowStockThreshold');
        expect(item).toHaveProperty('isLowStock');
        expect(item).toHaveProperty('stockStatus');
      });
    });

    it('should filter inventory by location', async () => {
      const response = await request(app)
        .get('/api/inventory/status')
        .query({ locationId: 'loc-kitchen-east' })
        .expect(200);

      response.body.inventory.forEach((item) => {
        expect(item.locationId).toBe('loc-kitchen-east');
      });
    });
  });

  describe('Transaction atomicity via API', () => {
    it('should maintain data integrity across failed requests', async () => {
      const initialStatus = await request(app)
        .get('/api/inventory/status')
        .query({ locationId: 'loc-kitchen-east' });

      const initialFlour = initialStatus.body.inventory.find((item) => item.itemId === 'item-flour');

      await request(app)
        .post('/api/stock/consume')
        .send({
          itemId: 'item-flour',
          locationId: 'loc-kitchen-east',
          quantity: 999,
          userId: 'user-fail',
        })
        .expect(400);

      const finalStatus = await request(app)
        .get('/api/inventory/status')
        .query({ locationId: 'loc-kitchen-east' });

      const finalFlour = finalStatus.body.inventory.find((item) => item.itemId === 'item-flour');
      expect(finalFlour.quantity).toBe(initialFlour.quantity);

      const movements = await request(app)
        .get('/api/stock/movements')
        .query({ itemId: 'item-flour', locationId: 'loc-kitchen-east' });
      expect(movements.body.movements).toHaveLength(0);
    });

    it('should process concurrent operations correctly', async () => {
      const operations = [];

      for (let i = 0; i < 5; i++) {
        operations.push(
          request(app)
            .post('/api/stock/receive')
            .send({
              itemId: 'item-olive-oil',
              locationId: 'loc-kitchen-east',
              quantity: 1,
              userId: `user-${i}`,
            })
        );
      }

      await Promise.all(operations);

      const status = await request(app)
        .get('/api/inventory/status')
        .query({ locationId: 'loc-kitchen-east' });

      const oliveOil = status.body.inventory.find((item) => item.itemId === 'item-olive-oil');
      expect(oliveOil.quantity).toBe(25);

      const movements = await request(app)
        .get('/api/stock/movements')
        .query({ itemId: 'item-olive-oil', locationId: 'loc-kitchen-east' });
      expect(movements.body.movements).toHaveLength(5);
    });
  });
});
