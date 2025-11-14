const request = require('supertest');
const app = require('../server');
const pool = require('../src/db/connection');

describe('Purchase Orders API', () => {
  let testSupplierId;
  let testItemId;
  let testLocationId;
  let testPoId;

  beforeAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM purchase_orders WHERE po_number LIKE $1', ['PO-%']);
    await pool.query('DELETE FROM suppliers WHERE name LIKE $1', ['PO Test Supplier%']);
    await pool.query('DELETE FROM items WHERE sku LIKE $1', ['PO-TEST-%']);
    await pool.query('DELETE FROM locations WHERE name LIKE $1', ['PO Test Location%']);

    // Create test supplier
    const supplierResult = await pool.query(`
      INSERT INTO suppliers (name, contact_email, lead_time_days)
      VALUES ('PO Test Supplier', 'supplier@test.com', 5)
      RETURNING id
    `);
    testSupplierId = supplierResult.rows[0].id;

    // Create test item
    const itemResult = await pool.query(`
      INSERT INTO items (sku, name, barcode, unit_price, quantity)
      VALUES ('PO-TEST-001', 'PO Test Item 1', 'PO123456', 15.99, 50)
      RETURNING id
    `);
    testItemId = itemResult.rows[0].id;

    // Create test location
    const locationResult = await pool.query(`
      INSERT INTO locations (name, address)
      VALUES ('PO Test Location', '456 Test Ave')
      RETURNING id
    `);
    testLocationId = locationResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up
    await pool.query('DELETE FROM purchase_orders WHERE po_number LIKE $1', ['PO-%']);
    await pool.query('DELETE FROM suppliers WHERE name LIKE $1', ['PO Test Supplier%']);
    await pool.query('DELETE FROM items WHERE sku LIKE $1', ['PO-TEST-%']);
    await pool.query('DELETE FROM locations WHERE name LIKE $1', ['PO Test Location%']);
    await pool.end();
  });

  describe('POST /api/purchase-orders', () => {
    it('should create a new draft purchase order', async () => {
      const poData = {
        supplier_id: testSupplierId,
        location_id: testLocationId,
        notes: 'Test PO',
        created_by: 'test_user',
        items: [
          {
            item_id: testItemId,
            quantity: 10,
            unit_price: 15.99
          }
        ]
      };

      const response = await request(app)
        .post('/api/purchase-orders')
        .send(poData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('po_number');
      expect(response.body.status).toBe('draft');
      expect(response.body.supplier_id).toBe(testSupplierId);
      expect(response.body.location_id).toBe(testLocationId);
      expect(response.body.items).toHaveLength(1);
      expect(parseFloat(response.body.total_amount)).toBeGreaterThan(0);

      testPoId = response.body.id;
    });

    it('should return 400 if supplier_id is missing', async () => {
      const response = await request(app)
        .post('/api/purchase-orders')
        .send({ location_id: testLocationId })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if location_id is missing', async () => {
      const response = await request(app)
        .post('/api/purchase-orders')
        .send({ supplier_id: testSupplierId })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/purchase-orders', () => {
    it('should get all purchase orders with pagination', async () => {
      const response = await request(app)
        .get('/api/purchase-orders')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter purchase orders by status', async () => {
      const response = await request(app)
        .get('/api/purchase-orders?status=draft')
        .expect(200);

      expect(response.body.data.every(po => po.status === 'draft')).toBe(true);
    });

    it('should filter purchase orders by supplier', async () => {
      const response = await request(app)
        .get(`/api/purchase-orders?supplier_id=${testSupplierId}`)
        .expect(200);

      expect(response.body.data.every(po => po.supplier_id === testSupplierId)).toBe(true);
    });
  });

  describe('GET /api/purchase-orders/:id', () => {
    it('should get a purchase order by id with items', async () => {
      const response = await request(app)
        .get(`/api/purchase-orders/${testPoId}`)
        .expect(200);

      expect(response.body.id).toBe(testPoId);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('supplier_name');
      expect(response.body).toHaveProperty('location_name');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should return 404 for non-existent purchase order', async () => {
      const response = await request(app)
        .get('/api/purchase-orders/999999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/purchase-orders/:id', () => {
    it('should update a draft purchase order', async () => {
      const updateData = {
        notes: 'Updated notes',
        items: [
          {
            item_id: testItemId,
            quantity: 15,
            unit_price: 14.99
          }
        ]
      };

      const response = await request(app)
        .put(`/api/purchase-orders/${testPoId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.notes).toBe(updateData.notes);
      expect(response.body.items[0].quantity).toBe(15);
    });

    it('should return 400 when trying to update non-draft PO', async () => {
      // Create and submit a PO
      const poData = {
        supplier_id: testSupplierId,
        location_id: testLocationId,
        items: [{ item_id: testItemId, quantity: 5, unit_price: 15.99 }]
      };

      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .send(poData);

      const poId = createResponse.body.id;

      await request(app)
        .post(`/api/purchase-orders/${poId}/submit`)
        .expect(200);

      // Try to update submitted PO
      const response = await request(app)
        .put(`/api/purchase-orders/${poId}`)
        .send({ notes: 'Should fail' })
        .expect(400);

      expect(response.body.error).toContain('only update draft');
    });
  });

  describe('POST /api/purchase-orders/:id/submit', () => {
    let draftPoId;

    beforeEach(async () => {
      // Create a draft PO for each test
      const poData = {
        supplier_id: testSupplierId,
        location_id: testLocationId,
        items: [{ item_id: testItemId, quantity: 5, unit_price: 15.99 }]
      };

      const response = await request(app)
        .post('/api/purchase-orders')
        .send(poData);

      draftPoId = response.body.id;
    });

    it('should submit a draft purchase order', async () => {
      const response = await request(app)
        .post(`/api/purchase-orders/${draftPoId}/submit`)
        .expect(200);

      expect(response.body.status).toBe('submitted');
      expect(response.body.submitted_at).toBeTruthy();
    });

    it('should return 400 when submitting non-draft PO', async () => {
      // Submit once
      await request(app)
        .post(`/api/purchase-orders/${draftPoId}/submit`)
        .expect(200);

      // Try to submit again
      const response = await request(app)
        .post(`/api/purchase-orders/${draftPoId}/submit`)
        .expect(400);

      expect(response.body.error).toContain('only submit draft');
    });

    it('should return 400 when submitting PO without items', async () => {
      // Create PO without items
      const poData = {
        supplier_id: testSupplierId,
        location_id: testLocationId,
        items: []
      };

      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .send(poData);

      const emptyPoId = createResponse.body.id;

      const response = await request(app)
        .post(`/api/purchase-orders/${emptyPoId}/submit`)
        .expect(400);

      expect(response.body.error).toContain('without items');
    });
  });

  describe('POST /api/purchase-orders/:id/receive', () => {
    let submittedPoId;

    beforeEach(async () => {
      // Create and submit a PO
      const poData = {
        supplier_id: testSupplierId,
        location_id: testLocationId,
        items: [{ item_id: testItemId, quantity: 20, unit_price: 15.99 }]
      };

      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .send(poData);

      submittedPoId = createResponse.body.id;

      await request(app)
        .post(`/api/purchase-orders/${submittedPoId}/submit`);
    });

    it('should receive items and update stock', async () => {
      // Get initial stock
      const initialStockResult = await pool.query(
        'SELECT quantity FROM items WHERE id = $1',
        [testItemId]
      );
      const initialStock = initialStockResult.rows[0].quantity;

      const receiveData = {
        items: [
          {
            item_id: testItemId,
            received_quantity: 20
          }
        ]
      };

      const response = await request(app)
        .post(`/api/purchase-orders/${submittedPoId}/receive`)
        .send(receiveData)
        .expect(200);

      expect(response.body.status).toBe('received');
      expect(response.body.received_at).toBeTruthy();
      expect(response.body.items[0].received_quantity).toBe(20);

      // Verify stock was updated
      const finalStockResult = await pool.query(
        'SELECT quantity FROM items WHERE id = $1',
        [testItemId]
      );
      const finalStock = finalStockResult.rows[0].quantity;
      expect(finalStock).toBe(initialStock + 20);
    });

    it('should allow partial receiving', async () => {
      const receiveData = {
        items: [
          {
            item_id: testItemId,
            received_quantity: 10
          }
        ]
      };

      const response = await request(app)
        .post(`/api/purchase-orders/${submittedPoId}/receive`)
        .send(receiveData)
        .expect(200);

      // Should still be submitted, not fully received
      expect(response.body.status).toBe('submitted');
      expect(response.body.items[0].received_quantity).toBe(10);
    });

    it('should return 400 if items array is missing', async () => {
      const response = await request(app)
        .post(`/api/purchase-orders/${submittedPoId}/receive`)
        .send({})
        .expect(400);

      expect(response.body.error).toContain('items array is required');
    });

    it('should return 400 when receiving non-submitted PO', async () => {
      // Create a draft PO
      const poData = {
        supplier_id: testSupplierId,
        location_id: testLocationId,
        items: [{ item_id: testItemId, quantity: 5, unit_price: 15.99 }]
      };

      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .send(poData);

      const draftPoId = createResponse.body.id;

      const receiveData = {
        items: [{ item_id: testItemId, received_quantity: 5 }]
      };

      const response = await request(app)
        .post(`/api/purchase-orders/${draftPoId}/receive`)
        .send(receiveData)
        .expect(400);

      expect(response.body.error).toContain('only receive submitted');
    });
  });

  describe('POST /api/purchase-orders/:id/cancel', () => {
    it('should cancel a draft purchase order', async () => {
      const poData = {
        supplier_id: testSupplierId,
        location_id: testLocationId,
        items: [{ item_id: testItemId, quantity: 5, unit_price: 15.99 }]
      };

      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .send(poData);

      const poId = createResponse.body.id;

      const response = await request(app)
        .post(`/api/purchase-orders/${poId}/cancel`)
        .expect(200);

      expect(response.body.status).toBe('cancelled');
    });

    it('should return 400 when cancelling received PO', async () => {
      // Create, submit, and receive a PO
      const poData = {
        supplier_id: testSupplierId,
        location_id: testLocationId,
        items: [{ item_id: testItemId, quantity: 5, unit_price: 15.99 }]
      };

      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .send(poData);

      const poId = createResponse.body.id;

      await request(app).post(`/api/purchase-orders/${poId}/submit`);
      await request(app)
        .post(`/api/purchase-orders/${poId}/receive`)
        .send({ items: [{ item_id: testItemId, received_quantity: 5 }] });

      const response = await request(app)
        .post(`/api/purchase-orders/${poId}/cancel`)
        .expect(400);

      expect(response.body.error).toContain('Cannot cancel received');
    });
  });

  describe('GET /api/purchase-orders/:id/export', () => {
    it('should export purchase order as CSV', async () => {
      const response = await request(app)
        .get(`/api/purchase-orders/${testPoId}/export?format=csv`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.text).toContain('PO Number');
      expect(response.text).toContain('Item SKU');
    });

    it('should return PDF placeholder', async () => {
      const response = await request(app)
        .get(`/api/purchase-orders/${testPoId}/export?format=pdf`)
        .expect(200);

      expect(response.body).toHaveProperty('placeholder', true);
      expect(response.body).toHaveProperty('po_number');
    });

    it('should return 400 for invalid format', async () => {
      const response = await request(app)
        .get(`/api/purchase-orders/${testPoId}/export?format=invalid`)
        .expect(400);

      expect(response.body.error).toContain('Invalid format');
    });
  });

  describe('DELETE /api/purchase-orders/:id', () => {
    it('should delete a draft purchase order', async () => {
      const poData = {
        supplier_id: testSupplierId,
        location_id: testLocationId,
        items: [{ item_id: testItemId, quantity: 5, unit_price: 15.99 }]
      };

      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .send(poData);

      const poId = createResponse.body.id;

      const response = await request(app)
        .delete(`/api/purchase-orders/${poId}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify it's deleted
      await request(app)
        .get(`/api/purchase-orders/${poId}`)
        .expect(404);
    });

    it('should return 400 when deleting non-draft PO', async () => {
      const poData = {
        supplier_id: testSupplierId,
        location_id: testLocationId,
        items: [{ item_id: testItemId, quantity: 5, unit_price: 15.99 }]
      };

      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .send(poData);

      const poId = createResponse.body.id;

      await request(app).post(`/api/purchase-orders/${poId}/submit`);

      const response = await request(app)
        .delete(`/api/purchase-orders/${poId}`)
        .expect(400);

      expect(response.body.error).toContain('only delete draft');
    });
  });

  describe('Business Rules Validation', () => {
    it('should enforce status transition: draft -> submitted -> received', async () => {
      const poData = {
        supplier_id: testSupplierId,
        location_id: testLocationId,
        items: [{ item_id: testItemId, quantity: 10, unit_price: 15.99 }]
      };

      // Create draft
      const createResponse = await request(app)
        .post('/api/purchase-orders')
        .send(poData);

      const poId = createResponse.body.id;
      expect(createResponse.body.status).toBe('draft');

      // Submit
      const submitResponse = await request(app)
        .post(`/api/purchase-orders/${poId}/submit`);

      expect(submitResponse.body.status).toBe('submitted');

      // Receive
      const receiveResponse = await request(app)
        .post(`/api/purchase-orders/${poId}/receive`)
        .send({ items: [{ item_id: testItemId, received_quantity: 10 }] });

      expect(receiveResponse.body.status).toBe('received');
    });

    it('should validate item availability in PO', async () => {
      const poData = {
        supplier_id: testSupplierId,
        location_id: testLocationId,
        items: [{ item_id: 999999, quantity: 10, unit_price: 15.99 }]
      };

      // This should fail due to foreign key constraint
      const response = await request(app)
        .post('/api/purchase-orders')
        .send(poData)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });
});
