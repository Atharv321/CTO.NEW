import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import { authService } from '../src/services/auth.js';
import { UserRole } from '@shared/types';

describe('Analytics API Endpoints', () => {
  let adminToken: string;
  let analystToken: string;
  let staffToken: string;

  beforeAll(async () => {
    // Create test users and get tokens
    const admin = await authService.register('admin@test.com', 'Admin User', 'password123', UserRole.ADMIN);
    const analyst = await authService.register('analyst@test.com', 'Analyst User', 'password123', UserRole.ANALYST);
    const staff = await authService.register('staff@test.com', 'Staff User', 'password123', UserRole.STAFF);

    const adminLogin = await authService.login('admin@test.com', 'password123');
    const analystLogin = await authService.login('analyst@test.com', 'password123');
    const staffLogin = await authService.login('staff@test.com', 'password123');

    adminToken = adminLogin!.accessToken;
    analystToken = analystLogin!.accessToken;
    staffToken = staffLogin!.accessToken;
  });

  describe('Authentication & Authorization', () => {
    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/valuation');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject requests from staff users', async () => {
      const response = await request(app)
        .get('/api/analytics/valuation')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should allow requests from admin users', async () => {
      const response = await request(app)
        .get('/api/analytics/valuation')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('should allow requests from analyst users', async () => {
      const response = await request(app)
        .get('/api/analytics/valuation')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('Analytics Endpoints', () => {
    describe('GET /api/analytics/valuation', () => {
      it('should return inventory valuation data', async () => {
        const response = await request(app)
          .get('/api/analytics/valuation')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);

        if (response.body.data.length > 0) {
          const valuation = response.body.data[0];
          expect(valuation).toHaveProperty('locationId');
          expect(valuation).toHaveProperty('locationName');
          expect(valuation).toHaveProperty('totalValue');
          expect(valuation).toHaveProperty('totalItems');
          expect(valuation).toHaveProperty('categoryBreakdown');
        }
      });

      it('should support query parameters', async () => {
        const response = await request(app)
          .get('/api/analytics/valuation')
          .query({ period: 'daily', startDate: '2024-01-01', endDate: '2024-01-31' })
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
      });
    });

    describe('GET /api/analytics/turnover', () => {
      it('should return inventory turnover data', async () => {
        const response = await request(app)
          .get('/api/analytics/turnover')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);

        if (response.body.data.length > 0) {
          const turnover = response.body.data[0];
          expect(turnover).toHaveProperty('period');
          expect(turnover).toHaveProperty('locationId');
          expect(turnover).toHaveProperty('locationName');
          expect(turnover).toHaveProperty('turnoverRatio');
          expect(turnover).toHaveProperty('daysOfSupply');
        }
      });
    });

    describe('GET /api/analytics/wastage', () => {
      it('should return wastage report data', async () => {
        const response = await request(app)
          .get('/api/analytics/wastage')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);

        if (response.body.data.length > 0) {
          const wastage = response.body.data[0];
          expect(wastage).toHaveProperty('period');
          expect(wastage).toHaveProperty('locationId');
          expect(wastage).toHaveProperty('locationName');
          expect(wastage).toHaveProperty('totalWastage');
          expect(wastage).toHaveProperty('wastageValue');
          expect(wastage).toHaveProperty('topWastedItems');
        }
      });
    });

    describe('GET /api/analytics/performance', () => {
      it('should return location performance data', async () => {
        const response = await request(app)
          .get('/api/analytics/performance')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);

        if (response.body.data.length > 0) {
          const performance = response.body.data[0];
          expect(performance).toHaveProperty('period');
          expect(performance).toHaveProperty('locationId');
          expect(performance).toHaveProperty('locationName');
          expect(performance).toHaveProperty('revenue');
          expect(performance).toHaveProperty('grossProfit');
          expect(performance).toHaveProperty('grossMargin');
        }
      });
    });

    describe('Chart Data Endpoints', () => {
      it('should return valuation chart data', async () => {
        const response = await request(app)
          .get('/api/analytics/charts/valuation')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('labels');
        expect(response.body.data).toHaveProperty('datasets');
      });

      it('should return turnover chart data', async () => {
        const response = await request(app)
          .get('/api/analytics/charts/turnover')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('labels');
        expect(response.body.data).toHaveProperty('datasets');
      });

      it('should return wastage chart data', async () => {
        const response = await request(app)
          .get('/api/analytics/charts/wastage')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('labels');
        expect(response.body.data).toHaveProperty('datasets');
      });

      it('should return performance chart data', async () => {
        const response = await request(app)
          .get('/api/analytics/charts/performance')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('labels');
        expect(response.body.data).toHaveProperty('datasets');
      });
    });

    describe('POST /api/analytics/cache/clear', () => {
      it('should clear analytics cache', async () => {
        const response = await request(app)
          .post('/api/analytics/cache/clear')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message');
      });
    });
  });

  describe('Authentication Endpoints', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should get current user info', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).toHaveProperty('role');
    });
  });

  describe('Scheduler Endpoints', () => {
    it('should get active scheduler tasks', async () => {
      const response = await request(app)
        .get('/api/scheduler/tasks')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('tasks');
      expect(Array.isArray(response.body.data.tasks)).toBe(true);
    });

    it('should trigger manual snapshot generation', async () => {
      const response = await request(app)
        .post('/api/scheduler/trigger/daily')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject scheduler access for non-admin users', async () => {
      const response = await request(app)
        .get('/api/scheduler/tasks')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid endpoints', async () => {
      const response = await request(app)
        .get('/api/analytics/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/valuation')
        .query({ period: 'invalid' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200); // Should still work, just use default
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
    });
  });
});