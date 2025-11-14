const request = require('supertest');
const app = require('./server');

describe('Stock Management API', () => {
  let testProduct;
  let testLocation;
  let testProductId;
  let testLocationId;

  beforeAll(async () => {
    // Create test product with unique SKU
    const productResponse = await request(app)
      .post('/api/stock/products')
      .send({
        sku: `TEST-001-${Date.now()}`,
        name: 'Test Product',
        description: 'Test product for stock management',
        barcode: '1234567890123'
      });
    
    expect(productResponse.status).toBe(201);
    testProduct = productResponse.body.data;
    testProductId = testProduct.id;

    // Create test location with unique name
    const locationResponse = await request(app)
      .post('/api/stock/locations')
      .send({
        name: `Test Warehouse-${Date.now()}`,
        description: 'Test warehouse location',
        address: '123 Test Street'
      });
    
    expect(locationResponse.status).toBe(201);
    testLocation = locationResponse.body.data;
    testLocationId = testLocation.id;
  });

  describe('Product Management', () => {
    test('POST /api/stock/products - should create a new product', async () => {
      const response = await request(app)
        .post('/api/stock/products')
        .send({
          sku: `TEST-002-${Date.now()}`,
          name: 'Another Test Product',
          description: 'Another test product',
          barcode: '9876543210987'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sku).toContain('TEST-002');
      expect(response.body.data.name).toBe('Another Test Product');
    });

    test('GET /api/stock/products/:id - should get product by ID', async () => {
      const response = await request(app)
        .get(`/api/stock/products/${testProductId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testProductId);
      expect(response.body.data.sku).toContain('TEST-001');
    });

    test('GET /api/stock/products - should get all products', async () => {
      const response = await request(app)
        .get('/api/stock/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('POST /api/stock/products - should reject duplicate SKU', async () => {
      const response = await request(app)
        .post('/api/stock/products')
        .send({
          sku: 'TEST-001', // Duplicate SKU
          name: 'Duplicate Product'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('Location Management', () => {
    test('POST /api/stock/locations - should create a new location', async () => {
      const response = await request(app)
        .post('/api/stock/locations')
        .send({
          name: `Another Test Location-${Date.now()}`,
          description: 'Another test location',
          address: '456 Test Avenue'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toContain('Another Test Location');
    });

    test('GET /api/stock/locations/:id - should get location by ID', async () => {
      const response = await request(app)
        .get(`/api/stock/locations/${testLocationId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testLocationId);
      expect(response.body.data.name).toContain('Test Warehouse');
    });

    test('GET /api/stock/locations - should get all locations', async () => {
      const response = await request(app)
        .get('/api/stock/locations');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Stock Movements', () => {
    test('POST /api/stock/receive - should receive stock', async () => {
      const response = await request(app)
        .post('/api/stock/receive')
        .send({
          productId: testProductId,
          locationId: testLocationId,
          quantity: 100,
          reason: 'Initial stock receipt',
          referenceNumber: 'PO-001',
          barcode: '1234567890123'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.movementId).toBeDefined();
      expect(response.body.inventory.quantity).toBe('100.000');
    });

    test('POST /api/stock/consume - should consume stock', async () => {
      const response = await request(app)
        .post('/api/stock/consume')
        .send({
          productId: testProductId,
          locationId: testLocationId,
          quantity: 25,
          reason: 'Used in production',
          referenceNumber: 'WO-001',
          barcode: '1234567890123'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.movementId).toBeDefined();
      expect(response.body.inventory.quantity).toBe('75.000');
    });

    test('POST /api/stock/adjust - should adjust stock', async () => {
      const response = await request(app)
        .post('/api/stock/adjust')
        .send({
          productId: testProductId,
          locationId: testLocationId,
          quantity: 80, // Adjust from 75 to 80
          reason: 'Physical count adjustment',
          referenceNumber: 'ADJ-001'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.movementId).toBeDefined();
      expect(response.body.inventory.quantity).toBe('80.000');
    });

    test('POST /api/stock/consume - should reject insufficient stock', async () => {
      const response = await request(app)
        .post('/api/stock/consume')
        .send({
          productId: testProductId,
          locationId: testLocationId,
          quantity: 200, // More than available
          reason: 'Attempt to over-consume'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Insufficient stock');
    });

    test('GET /api/stock/history - should get stock movement history', async () => {
      const response = await request(app)
        .get('/api/stock/history');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Inventory Management', () => {
    test('GET /api/stock/inventory - should get specific inventory', async () => {
      const response = await request(app)
        .get(`/api/stock/inventory?productId=${testProductId}&locationId=${testLocationId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.product_id).toBe(testProductId);
      expect(response.body.data.location_id).toBe(testLocationId);
      expect(response.body.data.quantity).toBe('80.000');
    });

    test('GET /api/stock/inventory - should get all inventory', async () => {
      const response = await request(app)
        .get('/api/stock/inventory');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Low Stock Management', () => {
    test('PUT /api/stock/low-stock/threshold - should update low stock threshold', async () => {
      const response = await request(app)
        .put('/api/stock/low-stock/threshold')
        .send({
          productId: testProductId,
          locationId: testLocationId,
          threshold: 50
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /api/stock/low-stock - should get low stock alerts', async () => {
      const response = await request(app)
        .get('/api/stock/low-stock');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Audit Log', () => {
    test('GET /api/stock/audit - should get audit log', async () => {
      const response = await request(app)
        .get('/api/stock/audit');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('GET /api/stock/audit - should filter audit log by table name', async () => {
      const response = await request(app)
        .get('/api/stock/audit?tableName=inventory');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('POST /api/stock/receive - should validate required fields', async () => {
      const response = await request(app)
        .post('/api/stock/receive')
        .send({
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    test('GET /api/stock/products/:id - should handle non-existent product', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/stock/products/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    test('GET /api/stock/locations/:id - should handle non-existent location', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/stock/locations/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('Health Check', () => {
    test('GET /health - should return OK status', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
    });

    test('GET / - should return API information', async () => {
      const response = await request(app)
        .get('/');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Stock Management API');
      expect(response.body.version).toBe('1.0.0');
    });
  });
});