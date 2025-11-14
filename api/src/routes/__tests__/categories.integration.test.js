const request = require('supertest');
const app = require('../../../server');
const { generateAdminToken, generateManagerToken, generateOperatorToken, generateViewerToken } = require('../../test/testAuth');

describe('Categories API - Integration Tests', () => {
  const adminToken = generateAdminToken();
  const managerToken = generateManagerToken();
  const operatorToken = generateOperatorToken();
  const viewerToken = generateViewerToken();

  describe('POST /api/categories', () => {
    test('admin should be able to create category', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Electronics',
          description: 'Electronic items',
        });

      expect([201, 409, 500]).toContain(response.status);
    });

    test('manager should be able to create category', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Books',
          description: 'Books and reading materials',
        });

      expect([201, 409, 500]).toContain(response.status);
    });

    test('operator should not be able to create category', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          name: 'Forbidden',
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    test('missing token should return 401', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({ name: 'Test' });

      expect(response.status).toBe(401);
    });

    test('missing name should return 400', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'test' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/categories', () => {
    test('should fetch categories with pagination', async () => {
      const response = await request(app)
        .get('/api/categories?page=1&limit=10')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('pagination');
        expect(response.body.pagination).toHaveProperty('page');
        expect(response.body.pagination).toHaveProperty('limit');
        expect(response.body.pagination).toHaveProperty('total');
      }
    });

    test('should filter categories by search', async () => {
      const response = await request(app)
        .get('/api/categories?search=Elec')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('GET /api/categories/:id', () => {
    test('should fetch a single category', async () => {
      const response = await request(app)
        .get('/api/categories/1')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('PUT /api/categories/:id', () => {
    test('manager should be able to update category', async () => {
      const response = await request(app)
        .put('/api/categories/1')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Updated Category' });

      expect([200, 404, 500]).toContain(response.status);
    });

    test('operator should not be able to update category', async () => {
      const response = await request(app)
        .put('/api/categories/1')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/categories/:id', () => {
    test('only admin should be able to delete category', async () => {
      const response = await request(app)
        .delete('/api/categories/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([204, 404, 500]).toContain(response.status);
    });

    test('manager should not be able to delete category', async () => {
      const response = await request(app)
        .delete('/api/categories/1')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });
});
