const request = require('supertest');
const app = require('../server');
const { setupTestDatabase, cleanupTestDatabase } = require('./setup');
const { runMigrations } = require('../src/db/migrations');

describe('Services API', () => {
  let authToken;

  beforeAll(async () => {
    await runMigrations();
  });

  beforeEach(async () => {
    await setupTestDatabase();

    // Login to get auth token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'testpassword',
      });
    authToken = response.body.token;
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  describe('GET /api/admin/services', () => {
    it('should get all services with auth', async () => {
      const response = await request(app)
        .get('/api/admin/services')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('services');
      expect(Array.isArray(response.body.services)).toBe(true);
      expect(response.body.services.length).toBeGreaterThan(0);
    });

    it('should reject without auth', async () => {
      await request(app)
        .get('/api/admin/services')
        .expect(401);
    });
  });

  describe('POST /api/admin/services', () => {
    it('should create a new service', async () => {
      const newService = {
        name: 'Beard Trim',
        description: 'Professional beard trim',
        duration_minutes: 20,
        price: 15.00,
        active: true,
      };

      const response = await request(app)
        .post('/api/admin/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newService)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newService.name);
      expect(parseFloat(response.body.price)).toBe(newService.price);
    });

    it('should reject invalid service data', async () => {
      const invalidService = {
        name: 'Test',
        // missing required fields
      };

      await request(app)
        .post('/api/admin/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidService)
        .expect(400);
    });
  });

  describe('PUT /api/admin/services/:id', () => {
    it('should update an existing service', async () => {
      // Create a service first
      const createResponse = await request(app)
        .post('/api/admin/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Service',
          description: 'Test',
          duration_minutes: 30,
          price: 20.00,
        });

      const serviceId = createResponse.body.id;

      const updates = {
        name: 'Updated Service',
        price: 25.00,
      };

      const response = await request(app)
        .put(`/api/admin/services/${serviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.name).toBe(updates.name);
      expect(parseFloat(response.body.price)).toBe(updates.price);
    });

    it('should return 404 for non-existent service', async () => {
      await request(app)
        .put('/api/admin/services/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /api/admin/services/:id', () => {
    it('should delete a service without bookings', async () => {
      // Create a service
      const createResponse = await request(app)
        .post('/api/admin/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Temporary Service',
          description: 'Test',
          duration_minutes: 30,
          price: 20.00,
        });

      const serviceId = createResponse.body.id;

      const response = await request(app)
        .delete(`/api/admin/services/${serviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });
});
