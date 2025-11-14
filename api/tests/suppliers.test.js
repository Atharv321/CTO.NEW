const request = require('supertest');
const app = require('../server');
const pool = require('../src/db/connection');

describe('Suppliers API', () => {
  let testSupplierId;
  let testItemId;
  let testLocationId;

  beforeAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM suppliers WHERE name LIKE $1', ['Test Supplier%']);
    await pool.query('DELETE FROM items WHERE sku LIKE $1', ['TEST-%']);
    await pool.query('DELETE FROM locations WHERE name LIKE $1', ['Test Location%']);

    // Create test item
    const itemResult = await pool.query(`
      INSERT INTO items (sku, name, barcode, unit_price, quantity)
      VALUES ('TEST-001', 'Test Item 1', '123456789', 10.99, 100)
      RETURNING id
    `);
    testItemId = itemResult.rows[0].id;

    // Create test location
    const locationResult = await pool.query(`
      INSERT INTO locations (name, address)
      VALUES ('Test Location 1', '123 Test St')
      RETURNING id
    `);
    testLocationId = locationResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up
    await pool.query('DELETE FROM suppliers WHERE name LIKE $1', ['Test Supplier%']);
    await pool.query('DELETE FROM items WHERE sku LIKE $1', ['TEST-%']);
    await pool.query('DELETE FROM locations WHERE name LIKE $1', ['Test Location%']);
    await pool.end();
  });

  describe('POST /api/suppliers', () => {
    it('should create a new supplier', async () => {
      const supplierData = {
        name: 'Test Supplier 1',
        contact_name: 'John Doe',
        contact_email: 'john@example.com',
        contact_phone: '555-1234',
        address: '123 Main St',
        lead_time_days: 7,
        notes: 'Reliable supplier'
      };

      const response = await request(app)
        .post('/api/suppliers')
        .send(supplierData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(supplierData.name);
      expect(response.body.contact_email).toBe(supplierData.contact_email);
      expect(response.body.lead_time_days).toBe(supplierData.lead_time_days);
      expect(response.body.active).toBe(true);

      testSupplierId = response.body.id;
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/suppliers')
        .send({ contact_email: 'test@example.com' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/suppliers', () => {
    it('should get all suppliers with pagination', async () => {
      const response = await request(app)
        .get('/api/suppliers')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('total');
    });

    it('should filter suppliers by active status', async () => {
      const response = await request(app)
        .get('/api/suppliers?active=true')
        .expect(200);

      expect(response.body.data.every(s => s.active === true)).toBe(true);
    });

    it('should search suppliers by name', async () => {
      const response = await request(app)
        .get('/api/suppliers?search=Test')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/suppliers/:id', () => {
    it('should get a supplier by id with details', async () => {
      const response = await request(app)
        .get(`/api/suppliers/${testSupplierId}`)
        .expect(200);

      expect(response.body.id).toBe(testSupplierId);
      expect(response.body).toHaveProperty('preferred_items');
      expect(response.body).toHaveProperty('locations');
      expect(Array.isArray(response.body.preferred_items)).toBe(true);
      expect(Array.isArray(response.body.locations)).toBe(true);
    });

    it('should return 404 for non-existent supplier', async () => {
      const response = await request(app)
        .get('/api/suppliers/999999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/suppliers/:id', () => {
    it('should update a supplier', async () => {
      const updateData = {
        contact_email: 'updated@example.com',
        lead_time_days: 10
      };

      const response = await request(app)
        .put(`/api/suppliers/${testSupplierId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.contact_email).toBe(updateData.contact_email);
      expect(response.body.lead_time_days).toBe(updateData.lead_time_days);
    });

    it('should return 404 for non-existent supplier', async () => {
      const response = await request(app)
        .put('/api/suppliers/999999')
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/suppliers/:id/items', () => {
    it('should add a preferred item to supplier', async () => {
      const itemData = {
        item_id: testItemId,
        supplier_sku: 'SUP-001',
        unit_price: 9.99,
        minimum_order_quantity: 10
      };

      const response = await request(app)
        .post(`/api/suppliers/${testSupplierId}/items`)
        .send(itemData)
        .expect(201);

      expect(response.body.supplier_id).toBe(testSupplierId);
      expect(response.body.item_id).toBe(testItemId);
      expect(parseFloat(response.body.unit_price)).toBe(itemData.unit_price);
    });

    it('should return 400 if item_id is missing', async () => {
      const response = await request(app)
        .post(`/api/suppliers/${testSupplierId}/items`)
        .send({ unit_price: 10.00 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/suppliers/:id/locations', () => {
    it('should link a location to supplier', async () => {
      const response = await request(app)
        .post(`/api/suppliers/${testSupplierId}/locations`)
        .send({ location_id: testLocationId })
        .expect(201);

      expect(response.body.supplier_id).toBe(testSupplierId);
      expect(response.body.location_id).toBe(testLocationId);
    });

    it('should return 400 if location_id is missing', async () => {
      const response = await request(app)
        .post(`/api/suppliers/${testSupplierId}/locations`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/suppliers/:id/items/:itemId', () => {
    it('should remove a preferred item from supplier', async () => {
      const response = await request(app)
        .delete(`/api/suppliers/${testSupplierId}/items/${testItemId}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/suppliers/:id/locations/:locationId', () => {
    it('should unlink a location from supplier', async () => {
      const response = await request(app)
        .delete(`/api/suppliers/${testSupplierId}/locations/${testLocationId}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/suppliers/:id', () => {
    it('should soft delete a supplier', async () => {
      const response = await request(app)
        .delete(`/api/suppliers/${testSupplierId}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.supplier.active).toBe(false);
    });

    it('should hard delete a supplier when hard=true', async () => {
      // Create a new supplier for hard delete
      const createResponse = await request(app)
        .post('/api/suppliers')
        .send({ name: 'Test Supplier To Delete' })
        .expect(201);

      const supplierId = createResponse.body.id;

      const response = await request(app)
        .delete(`/api/suppliers/${supplierId}?hard=true`)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify it's really gone
      await request(app)
        .get(`/api/suppliers/${supplierId}`)
        .expect(404);
    });
  });
});
