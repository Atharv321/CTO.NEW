const request = require('supertest');
const app = require('./server');

describe('Low Stock Service Tests', () => {
  let testProduct;
  let testLocation;
  let testProductId;
  let testLocationId;

  beforeAll(async () => {
    // Create test product with unique SKU
    const productResponse = await request(app)
      .post('/api/stock/products')
      .send({
        sku: `LOWSTOCK-TEST-001-${Date.now()}`,
        name: 'Low Stock Test Product',
        description: 'Product for low stock testing',
        barcode: 'LOWSTOCK123456'
      });
    
    testProduct = productResponse.body.data;
    testProductId = testProduct.id;

    // Create test location with unique name
    const locationResponse = await request(app)
      .post('/api/stock/locations')
      .send({
        name: `Low Stock Test Warehouse-${Date.now()}`,
        description: 'Warehouse for low stock testing',
        address: '456 Low Stock Street'
      });
    
    testLocation = locationResponse.body.data;
    testLocationId = testLocation.id;

    // Setup initial inventory and movements for testing
    await request(app)
      .post('/api/stock/receive')
      .send({
        productId: testProductId,
        locationId: testLocationId,
        quantity: 100,
        reason: 'Initial stock for low stock testing'
      });

    await request(app)
      .put('/api/stock/low-stock/threshold')
      .send({
        productId: testProductId,
        locationId: testLocationId,
        threshold: 30
      });
  });

  describe('Low Stock Notifications', () => {
    test('GET /api/stock/low-stock/notifications - should generate notifications', async () => {
      // Consume stock to trigger low stock
      await request(app)
        .post('/api/stock/consume')
        .send({
          productId: testProductId,
          locationId: testLocationId,
          quantity: 80, // Leave 20, which is below threshold of 30
          reason: 'Consume to trigger low stock'
        });

      const response = await request(app)
        .get('/api/stock/low-stock/notifications');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.notifications)).toBe(true);
      expect(response.body.summary).toBeDefined();
      
      // Should have at least one critical notification
      const criticalNotifications = response.body.notifications.filter(n => n.type === 'LOW_STOCK_CRITICAL');
      expect(criticalNotifications.length).toBeGreaterThan(0);
      
      const notification = criticalNotifications[0];
      expect(notification.productId).toBe(testProductId);
      expect(notification.locationId).toBe(testLocationId);
      expect(notification.priority).toBe('HIGH');
      expect(notification.message).toContain('Critical');
    });

    test('GET /api/stock/low-stock/notifications - should filter by location', async () => {
      // Create another location and product for filtering test
      const otherLocationResponse = await request(app)
        .post('/api/stock/locations')
        .send({
          name: 'Other Location',
          description: 'Other location for filtering test'
        });

      const otherLocationId = otherLocationResponse.body.data.id;

      const response = await request(app)
        .get(`/api/stock/low-stock/notifications?locationId=${testLocationId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // All notifications should be for the specified location
      response.body.notifications.forEach(notification => {
        expect(notification.locationId).toBe(testLocationId);
      });
    });
  });

  describe('Stock Health Metrics', () => {
    test('GET /api/stock/low-stock/health - should return health metrics', async () => {
      const response = await request(app)
        .get('/api/stock/low-stock/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      
      const metrics = response.body.data;
      expect(metrics.totalItems).toBeDefined();
      expect(metrics.lowStockItems).toBeDefined();
      expect(metrics.lowStockPercentage).toBeDefined();
      expect(metrics.inventoryHealthScore).toBeDefined();
      expect(metrics.healthStatus).toBeDefined();
      expect(metrics.weeklyMovements).toBeDefined();
      
      expect(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL']).toContain(metrics.healthStatus);
    });

    test('GET /api/stock/low-stock/health - should filter by location', async () => {
      const response = await request(app)
        .get(`/api/stock/low-stock/health?locationId=${testLocationId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.locationId).toBe(testLocationId);
    });
  });

  describe('Top Consuming Products', () => {
    test('GET /api/stock/low-stock/top-consumers - should return top consumers', async () => {
      // Create some consumption history
      const consumptions = [10, 15, 20, 25, 30];
      
      for (const quantity of consumptions) {
        await request(app)
          .post('/api/stock/receive')
          .send({
            productId: testProductId,
            locationId: testLocationId,
            quantity: quantity,
            reason: 'Setup for top consumers test'
          });

        await request(app)
          .post('/api/stock/consume')
          .send({
            productId: testProductId,
            locationId: testLocationId,
            quantity: quantity,
            reason: 'Consumption for top consumers test'
          });
      }

      const response = await request(app)
        .get('/api/stock/low-stock/top-consumers');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        const topConsumer = response.body.data[0];
        expect(topConsumer.product_id).toBeDefined();
        expect(topConsumer.sku).toBeDefined();
        expect(topConsumer.total_consumed).toBeDefined();
        expect(topConsumer.consumption_events).toBeDefined();
        expect(topConsumer.avg_consumption_per_event).toBeDefined();
      }
    });

    test('GET /api/stock/low-stock/top-consumers - should respect query parameters', async () => {
      const response = await request(app)
        .get('/api/stock/low-stock/top-consumers?days=7&limit=5');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.parameters.days).toBe(7);
      expect(response.body.parameters.limit).toBe(5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Slow Moving Inventory', () => {
    test('GET /api/stock/low-stock/slow-moving - should identify slow moving items', async () => {
      // Create a product that hasn't been consumed recently
      const slowProductResponse = await request(app)
        .post('/api/stock/products')
        .send({
          sku: 'SLOW-MOVING-001',
          name: 'Slow Moving Product',
          description: 'Product that moves slowly'
        });

      const slowProductId = slowProductResponse.body.data.id;

      await request(app)
        .post('/api/stock/receive')
        .send({
          productId: slowProductId,
          locationId: testLocationId,
          quantity: 50,
          reason: 'Slow moving product setup'
        });

      const response = await request(app)
        .get('/api/stock/low-stock/slow-moving');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        const slowItem = response.body.data[0];
        expect(slowItem.product_id).toBeDefined();
        expect(slowItem.movement_status).toBeDefined();
        expect(['Never consumed', 'Slow moving', 'Active']).toContain(slowItem.movement_status);
      }
    });
  });

  describe('Approaching Low Stock', () => {
    test('GET /api/stock/low-stock/approaching - should predict low stock', async () => {
      // Create a product with regular consumption pattern
      const regularProductResponse = await request(app)
        .post('/api/stock/products')
        .send({
          sku: 'REGULAR-CONSUME-001',
          name: 'Regular Consumption Product',
          description: 'Product with regular consumption'
        });

      const regularProductId = regularProductResponse.body.data.id;

      // Setup inventory and consumption history
      await request(app)
        .post('/api/stock/receive')
        .send({
          productId: regularProductId,
          locationId: testLocationId,
          quantity: 100,
          reason: 'Setup for approaching test'
        });

      await request(app)
        .put('/api/stock/low-stock/threshold')
        .send({
          productId: regularProductId,
          locationId: testLocationId,
          threshold: 20
        });

      // Create consumption history over several days
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/stock/consume')
          .send({
            productId: regularProductId,
            locationId: testLocationId,
            quantity: 5,
            reason: `Daily consumption ${i + 1}`
          });
      }

      const response = await request(app)
        .get('/api/stock/low-stock/approaching');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        const approachingItem = response.body.data[0];
        expect(approachingItem.product_id).toBeDefined();
        expect(approachingItem.days_until_low_stock).toBeDefined();
        expect(approachingItem.is_approaching_low_stock).toBeDefined();
        expect(typeof approachingItem.is_approaching_low_stock).toBe('boolean');
      }
    });

    test('GET /api/stock/low-stock/approaching - should respect daysAhead parameter', async () => {
      const response = await request(app)
        .get('/api/stock/low-stock/approaching?daysAhead=14');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.parameters.daysAhead).toBe(14);
    });
  });

  describe('Integration with Stock Movements', () => {
    test('Low stock notifications should update after stock movements', async () => {
      // Get initial notifications
      const initialResponse = await request(app)
        .get('/api/stock/low-stock/notifications');

      const initialCriticalCount = initialResponse.summary.critical;

      // Receive stock to bring quantity above threshold
      await request(app)
        .post('/api/stock/receive')
        .send({
          productId: testProductId,
          locationId: testLocationId,
          quantity: 50,
          reason: 'Restock to clear low stock'
        });

      // Get updated notifications
      const updatedResponse = await request(app)
        .get('/api/stock/low-stock/notifications');

      // Should have fewer critical notifications
      expect(updatedResponse.summary.critical).toBeLessThanOrEqual(initialCriticalCount);
    });
  });

  describe('Error Handling', () => {
    test('Should handle invalid location ID gracefully', async () => {
      const invalidId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .get(`/api/stock/low-stock/notifications?locationId=${invalidId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.notifications).toEqual([]);
    });

    test('Should handle invalid query parameters gracefully', async () => {
      const response = await request(app)
        .get('/api/stock/low-stock/top-consumers?days=invalid&limit=invalid');

      // Should default to reasonable values
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});