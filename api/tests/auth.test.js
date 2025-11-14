const request = require('supertest');
const app = require('../server');
const { setupTestDatabase, cleanupTestDatabase } = require('./setup');
const { runMigrations } = require('../src/db/migrations');

describe('Auth API', () => {
  beforeAll(async () => {
    await runMigrations();
  });

  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'testpassword',
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('admin');
      expect(response.body.admin.email).toBe('admin@test.com');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('POST /api/auth/magic-link', () => {
    it('should request magic link for existing admin', async () => {
      const response = await request(app)
        .post('/api/auth/magic-link')
        .send({
          email: 'admin@test.com',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle non-existent email gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/magic-link')
        .send({
          email: 'nonexistent@test.com',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/verify-magic-link', () => {
    it('should verify valid magic link', async () => {
      // Request magic link first
      const magicLinkResponse = await request(app)
        .post('/api/auth/magic-link')
        .send({
          email: 'admin@test.com',
        });

      const token = magicLinkResponse.body.token;

      // Verify the magic link
      const response = await request(app)
        .post('/api/auth/verify-magic-link')
        .send({ token })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('admin');
    });

    it('should reject invalid magic link', async () => {
      const response = await request(app)
        .post('/api/auth/verify-magic-link')
        .send({ token: 'invalid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject used magic link', async () => {
      // Request magic link
      const magicLinkResponse = await request(app)
        .post('/api/auth/magic-link')
        .send({
          email: 'admin@test.com',
        });

      const token = magicLinkResponse.body.token;

      // Use it once
      await request(app)
        .post('/api/auth/verify-magic-link')
        .send({ token })
        .expect(200);

      // Try to use it again
      const response = await request(app)
        .post('/api/auth/verify-magic-link')
        .send({ token })
        .expect(401);

      expect(response.body.message).toContain('already been used');
    });
  });
});
