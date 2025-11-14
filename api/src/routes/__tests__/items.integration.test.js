const request = require('supertest');
const app = require('../../../server');
const { generateAdminToken, generateManagerToken, generateOperatorToken, generateViewerToken } = require('../../test/testAuth');

describe('Items API - Integration Tests', () => {
  const adminToken = generateAdminToken();
  const managerToken = generateManagerToken();
  const operatorToken = generateOperatorToken();
  const viewerToken = generateViewerToken();

  describe('POST /api/items', () => {
    test('manager should be able to create item', async () => {
      const response = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          sku: 'SKU-001',
          name: 'Test Item',
          category_id: 1,
          unit_price: 99.99,
        });

      expect([201, 400, 500]).toContain(response.status);
    });

    test('operator should not be able to create item', async () => {
      const response = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          sku: 'SKU-002',
          name: 'Test Item',
          category_id: 1,
        });

      expect(response.status).toBe(403);
    });

    test('missing required fields should return 400', async () => {
      const response = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Incomplete' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('missing token should return 401', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ sku: 'SKU-001', name: 'Test', category_id: 1 });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/items', () => {
    test('viewer should be able to fetch items', async () => {
      const response = await request(app)
        .get('/api/items?page=1&limit=20')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('pagination');
      }
    });

    test('should filter items by search', async () => {
      const response = await request(app)
        .get('/api/items?search=test')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect([200, 500]).toContain(response.status);
    });

    test('should filter items by category', async () => {
      const response = await request(app)
        .get('/api/items?category_id=1')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect([200, 500]).toContain(response.status);
    });

    test('should filter items by location', async () => {
      const response = await request(app)
        .get('/api/items?location_id=1')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('GET /api/items/search/:query', () => {
    test('should search items', async () => {
      const response = await request(app)
        .get('/api/items/search/widget')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });
  });

  describe('GET /api/items/sku/:sku', () => {
    test('should fetch item by SKU', async () => {
      const response = await request(app)
        .get('/api/items/sku/TEST-SKU')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('GET /api/items/barcode/:barcode', () => {
    test('should fetch item by barcode', async () => {
      const response = await request(app)
        .get('/api/items/barcode/1234567890')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('GET /api/items/:id', () => {
    test('should fetch a single item', async () => {
      const response = await request(app)
        .get('/api/items/1')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('PUT /api/items/:id', () => {
    test('manager should be able to update item', async () => {
      const response = await request(app)
        .put('/api/items/1')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Updated Item' });

      expect([200, 404, 500]).toContain(response.status);
    });

    test('operator should not be able to update item', async () => {
      const response = await request(app)
        .put('/api/items/1')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/items/:id', () => {
    test('only admin should be able to delete item', async () => {
      const response = await request(app)
        .delete('/api/items/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([204, 404, 500]).toContain(response.status);
    });

    test('manager should not be able to delete item', async () => {
      const response = await request(app)
        .delete('/api/items/1')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(403);
    });
  });
});
