const request = require('supertest');
const jwt = require('jsonwebtoken');
const express = require('express');
const {
  verifyAccessToken,
  requireRole,
  requireAdmin,
  requireManager,
  requireStaff,
  injectUserContext,
} = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

describe('RBAC Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('verifyAccessToken', () => {
    it('should verify valid token and inject user', async () => {
      const token = jwt.sign(
        { userId: 'user-123', email: 'test@example.com', role: 'user' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      app.get('/protected', verifyAccessToken, (req, res) => {
        res.json({ user: req.user });
      });

      const res = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.userId).toBe('user-123');
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should reject request without token', async () => {
      app.get('/protected', verifyAccessToken, (req, res) => {
        res.json({ user: req.user });
      });

      const res = await request(app).get('/protected');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('should reject request with invalid token', async () => {
      app.get('/protected', verifyAccessToken, (req, res) => {
        res.json({ user: req.user });
      });

      const res = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('should reject expired token', async () => {
      const token = jwt.sign(
        { userId: 'user-123', email: 'test@example.com', role: 'user' },
        JWT_SECRET,
        { expiresIn: '0s' }
      );

      app.get('/protected', verifyAccessToken, (req, res) => {
        res.json({ user: req.user });
      });

      const res = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
    });
  });

  describe('requireRole', () => {
    it('should allow access for correct role', async () => {
      const token = jwt.sign(
        { userId: 'user-123', email: 'test@example.com', role: 'admin' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      app.get('/admin', verifyAccessToken, requireRole('admin'), (req, res) => {
        res.json({ message: 'Admin access granted' });
      });

      const res = await request(app)
        .get('/admin')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Admin access granted');
    });

    it('should deny access for incorrect role', async () => {
      const token = jwt.sign(
        { userId: 'user-123', email: 'test@example.com', role: 'user' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      app.get('/admin', verifyAccessToken, requireRole('admin'), (req, res) => {
        res.json({ message: 'Admin access granted' });
      });

      const res = await request(app)
        .get('/admin')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    it('should allow access for multiple valid roles', async () => {
      const token = jwt.sign(
        { userId: 'user-123', email: 'test@example.com', role: 'manager' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      app.get('/managers-admins', verifyAccessToken, requireRole('manager', 'admin'), (req, res) => {
        res.json({ message: 'Access granted' });
      });

      const res = await request(app)
        .get('/managers-admins')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe('requireAdmin', () => {
    it('should allow admin access', async () => {
      const token = jwt.sign(
        { userId: 'admin-123', email: 'admin@example.com', role: 'admin' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      app.get('/admin-only', verifyAccessToken, requireAdmin, (req, res) => {
        res.json({ message: 'Admin access granted' });
      });

      const res = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should deny manager access', async () => {
      const token = jwt.sign(
        { userId: 'manager-123', email: 'manager@example.com', role: 'manager' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      app.get('/admin-only', verifyAccessToken, requireAdmin, (req, res) => {
        res.json({ message: 'Admin access granted' });
      });

      const res = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('requireManager', () => {
    it('should allow manager and admin access', async () => {
      const token = jwt.sign(
        { userId: 'manager-123', email: 'manager@example.com', role: 'manager' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      app.get('/manager-level', verifyAccessToken, requireManager, (req, res) => {
        res.json({ message: 'Manager access granted' });
      });

      const res = await request(app)
        .get('/manager-level')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should deny staff access', async () => {
      const token = jwt.sign(
        { userId: 'staff-123', email: 'staff@example.com', role: 'staff' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      app.get('/manager-level', verifyAccessToken, requireManager, (req, res) => {
        res.json({ message: 'Manager access granted' });
      });

      const res = await request(app)
        .get('/manager-level')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('requireStaff', () => {
    it('should allow staff, manager, and admin access', async () => {
      const roles = ['staff', 'manager', 'admin'];

      for (const role of roles) {
        const token = jwt.sign(
          { userId: 'user-123', email: 'user@example.com', role },
          JWT_SECRET,
          { expiresIn: '15m' }
        );

        app.get(`/staff-level-${role}`, verifyAccessToken, requireStaff, (req, res) => {
          res.json({ message: 'Staff level access granted' });
        });

        const res = await request(app)
          .get(`/staff-level-${role}`)
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
      }
    });

    it('should deny user access', async () => {
      const token = jwt.sign(
        { userId: 'user-123', email: 'user@example.com', role: 'user' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      app.get('/staff-level', verifyAccessToken, requireStaff, (req, res) => {
        res.json({ message: 'Staff level access granted' });
      });

      const res = await request(app)
        .get('/staff-level')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('injectUserContext', () => {
    it('should inject user context when token is present', async () => {
      const token = jwt.sign(
        { userId: 'user-123', email: 'test@example.com', role: 'user' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      app.get('/maybe-protected', injectUserContext, (req, res) => {
        res.json({ user: req.user });
      });

      const res = await request(app)
        .get('/maybe-protected')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user).not.toBeNull();
      expect(res.body.user.userId).toBe('user-123');
    });

    it('should set user to null when no token is present', async () => {
      app.get('/maybe-protected', injectUserContext, (req, res) => {
        res.json({ user: req.user });
      });

      const res = await request(app).get('/maybe-protected');

      expect(res.status).toBe(200);
      expect(res.body.user).toBeNull();
    });

    it('should handle invalid tokens gracefully', async () => {
      app.get('/maybe-protected', injectUserContext, (req, res) => {
        res.json({ user: req.user });
      });

      const res = await request(app)
        .get('/maybe-protected')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(200);
      expect(res.body.user).toBeNull();
    });
  });
});
