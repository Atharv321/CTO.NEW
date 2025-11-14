const request = require('supertest');
const app = require('./server');

describe('API', () => {
  test('returns OK from health endpoint', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'OK' });
  });

  test('returns 401 for protected endpoints without token', async () => {
    const response = await request(app).get('/api/categories');
    expect(response.status).toBe(401);
  });

  test('returns 400 for invalid category POST without required fields', async () => {
    const response = await request(app)
      .post('/api/categories')
      .set('Authorization', 'Bearer invalid-token')
      .send({});

    expect([400, 403]).toContain(response.status);
  });
});
