const request = require('supertest');
const { createApp } = require('../server');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

describe('Auth Integration Tests', () => {
  let app;

  beforeAll(async () => {
    app = await createApp();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: `test-${Date.now()}@example.com`,
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.tokens).toBeDefined();
      expect(res.body.tokens.accessToken).toBeDefined();
      expect(res.body.tokens.refreshToken).toBeDefined();
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          // missing password, firstName, lastName
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 for password less than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('at least 8 characters');
    });
  });

  describe('POST /api/auth/login', () => {
    let testEmail;
    let testPassword;

    beforeAll(async () => {
      testEmail = `test-login-${Date.now()}@example.com`;
      testPassword = 'LoginTest123!';

      await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          firstName: 'Login',
          lastName: 'Test',
        });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.tokens).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication failed');
    });

    it('should return 401 for non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        });

      expect(res.status).toBe(401);
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          // missing password
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    let token;
    let testEmail;

    beforeAll(async () => {
      testEmail = `test-me-${Date.now()}@example.com`;

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'MeTest123!',
          firstName: 'Me',
          lastName: 'Test',
        });

      token = res.body.tokens.accessToken;
    });

    it('should return current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(testEmail);
      expect(res.body.firstName).toBe('Me');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });

    it('should return 401 with invalid Bearer format', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `invalid-format ${token}`);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/change-password', () => {
    let token;
    let testEmail;
    let originalPassword;

    beforeAll(async () => {
      testEmail = `test-pwd-${Date.now()}@example.com`;
      originalPassword = 'OriginalPassword123!';

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: originalPassword,
          firstName: 'Password',
          lastName: 'Test',
        });

      token = res.body.tokens.accessToken;
    });

    it('should change password with correct old password', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          oldPassword: originalPassword,
          newPassword: 'NewPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('successfully');
    });

    it('should return 400 with wrong old password', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          oldPassword: 'WrongPassword123!',
          newPassword: 'AnotherPassword123!',
        });

      expect(res.status).toBe(400);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .send({
          oldPassword: originalPassword,
          newPassword: 'NewPassword123!',
        });

      expect(res.status).toBe(401);
    });

    it('should return 400 for password less than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          oldPassword: originalPassword,
          newPassword: 'short',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let accessToken;
    let refreshToken;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: `test-refresh-${Date.now()}@example.com`,
          password: 'RefreshTest123!',
          firstName: 'Refresh',
          lastName: 'Test',
        });

      accessToken = res.body.tokens.accessToken;
      refreshToken = res.body.tokens.refreshToken;
    });

    it('should return new tokens with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.accessToken).not.toBe(accessToken);
    });

    it('should return 400 without refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 401 with invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).toBe(401);
    });
  });

  describe('RBAC Protection', () => {
    let adminToken;
    let managerToken;
    let staffToken;
    let userToken;

    beforeAll(async () => {
      // For demo purposes, create tokens with different roles
      adminToken = jwt.sign(
        { userId: 'admin-1', email: 'admin@test.com', role: 'admin' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      managerToken = jwt.sign(
        { userId: 'manager-1', email: 'manager@test.com', role: 'manager' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      staffToken = jwt.sign(
        { userId: 'staff-1', email: 'staff@test.com', role: 'staff' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      userToken = jwt.sign(
        { userId: 'user-1', email: 'user@test.com', role: 'user' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    it('should allow admin to access admin endpoint', async () => {
      const res = await request(app)
        .get('/api/protected/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should deny manager from accessing admin endpoint', async () => {
      const res = await request(app)
        .get('/api/protected/admin/dashboard')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow manager to access manager endpoint', async () => {
      const res = await request(app)
        .get('/api/protected/manager/locations')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
    });

    it('should allow admin to access manager endpoint', async () => {
      const res = await request(app)
        .get('/api/protected/manager/locations')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should deny user from accessing staff endpoint', async () => {
      const res = await request(app)
        .get('/api/protected/staff/inventory')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow staff to access staff endpoint', async () => {
      const res = await request(app)
        .get('/api/protected/staff/inventory')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('Protected Endpoints', () => {
    let validToken;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: `test-protected-${Date.now()}@example.com`,
          password: 'ProtectedTest123!',
          firstName: 'Protected',
          lastName: 'Test',
        });

      validToken = res.body.tokens.accessToken;
    });

    it('should access public-info endpoint with valid token', async () => {
      const res = await request(app)
        .get('/api/protected/public-info')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();
      expect(res.body.user).toBeDefined();
    });

    it('should return 401 for protected endpoint without token', async () => {
      const res = await request(app).get('/api/protected/public-info');

      expect(res.status).toBe(401);
    });

    it('should return proper error message for missing auth', async () => {
      const res = await request(app).get('/api/protected/public-info');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
      expect(res.body.message).toContain('token required');
    });
  });
});
