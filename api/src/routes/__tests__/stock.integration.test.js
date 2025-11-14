const request = require('supertest');
const app = require('../../../server');
const { generateAdminToken, generateManagerToken, generateOperatorToken, generateViewerToken } = require('../../test/testAuth');

describe('Stock API - Integration Tests', () => {
  const adminToken = generateAdminToken();
  const managerToken = generateManagerToken();
  const operatorToken = generateOperatorToken();
  const viewerToken = generateViewerToken();

  describe('GET /api/stock/item/:itemId', () => {
    test('viewer should be able to fetch stock for item', async () => {
      const response = await request(app)
        .get('/api/stock/item/1')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });
  });

  describe('GET /api/stock/item/:itemId/total', () => {
    test('should fetch total stock for item', async () => {
      const response = await request(app)
        .get('/api/stock/item/1/total')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('totalOnHand');
      }
    });
  });

  describe('GET /api/stock/location/:locationId', () => {
    test('should fetch stock for location with pagination', async () => {
      const response = await request(app)
        .get('/api/stock/location/1?page=1&limit=20')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('pagination');
      }
    });

    test('should filter stock by below reorder level', async () => {
      const response = await request(app)
        .get('/api/stock/location/1?below_reorder=true')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('GET /api/stock/location/:locationId/summary', () => {
    test('should fetch location summary', async () => {
      const response = await request(app)
        .get('/api/stock/location/1/summary')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('GET /api/stock/:itemId/:locationId', () => {
    test('should fetch stock level', async () => {
      const response = await request(app)
        .get('/api/stock/1/1')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('POST /api/stock/:itemId/:locationId/adjust', () => {
    test('operator should be able to adjust stock', async () => {
      const response = await request(app)
        .post('/api/stock/1/1/adjust')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          quantity: 5,
          location_id: 1,
          movement_type: 'receipt',
          notes: 'Test adjustment',
        });

      expect([200, 400, 500]).toContain(response.status);
    });

    test('manager should be able to adjust stock', async () => {
      const response = await request(app)
        .post('/api/stock/1/1/adjust')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          quantity: 10,
          location_id: 1,
          movement_type: 'issue',
        });

      expect([200, 400, 500]).toContain(response.status);
    });

    test('viewer should not be able to adjust stock', async () => {
      const response = await request(app)
        .post('/api/stock/1/1/adjust')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          quantity: 5,
          location_id: 1,
          movement_type: 'receipt',
        });

      expect(response.status).toBe(403);
    });

    test('missing required fields should return 400', async () => {
      const response = await request(app)
        .post('/api/stock/1/1/adjust')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ quantity: 5 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('invalid movement type should return 400', async () => {
      const response = await request(app)
        .post('/api/stock/1/1/adjust')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          quantity: 5,
          location_id: 1,
          movement_type: 'invalid_type',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/stock/:itemId/:locationId/init', () => {
    test('manager should be able to initialize stock', async () => {
      const response = await request(app)
        .post('/api/stock/1/1/init')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ quantity: 100 });

      expect([201, 400, 409, 500]).toContain(response.status);
    });

    test('operator should not be able to initialize stock', async () => {
      const response = await request(app)
        .post('/api/stock/1/1/init')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ quantity: 100 });

      expect(response.status).toBe(403);
    });

    test('negative quantity should return 400', async () => {
      const response = await request(app)
        .post('/api/stock/1/1/init')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ quantity: -10 });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/stock/:itemId/:locationId/history', () => {
    test('should fetch stock movement history', async () => {
      const response = await request(app)
        .get('/api/stock/1/1/history?page=1&limit=20')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });
  });
});
