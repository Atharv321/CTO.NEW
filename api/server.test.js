const request = require('supertest');
const app = require('./server');

describe('API', () => {
  test('returns OK from health endpoint', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'OK' });
  });
});
