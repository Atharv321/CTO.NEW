const request = require('supertest');
const app = require('../server');
const { setupTestDatabase, cleanupTestDatabase } = require('./setup');
const { runMigrations } = require('../src/db/migrations');

describe('Availability API', () => {
  let authToken;
  let barberId;

  beforeAll(async () => {
    await runMigrations();
  });

  beforeEach(async () => {
    const testData = await setupTestDatabase();
    barberId = testData.barberId;

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

  describe('Availability Templates', () => {
    describe('POST /api/admin/availability/templates', () => {
      it('should create availability template', async () => {
        const template = {
          barber_id: barberId,
          day_of_week: 1, // Monday
          start_time: '09:00',
          end_time: '17:00',
        };

        const response = await request(app)
          .post('/api/admin/availability/templates')
          .set('Authorization', `Bearer ${authToken}`)
          .send(template)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.barber_id).toBe(barberId);
        expect(response.body.day_of_week).toBe(1);
      });

      it('should reject invalid time range', async () => {
        const template = {
          barber_id: barberId,
          day_of_week: 1,
          start_time: '17:00',
          end_time: '09:00', // end before start
        };

        await request(app)
          .post('/api/admin/availability/templates')
          .set('Authorization', `Bearer ${authToken}`)
          .send(template)
          .expect(400);
      });

      it('should reject duplicate template', async () => {
        const template = {
          barber_id: barberId,
          day_of_week: 1,
          start_time: '09:00',
          end_time: '17:00',
        };

        // Create first template
        await request(app)
          .post('/api/admin/availability/templates')
          .set('Authorization', `Bearer ${authToken}`)
          .send(template);

        // Try to create duplicate
        await request(app)
          .post('/api/admin/availability/templates')
          .set('Authorization', `Bearer ${authToken}`)
          .send(template)
          .expect(409);
      });
    });

    describe('GET /api/admin/availability/templates/barber/:barberId', () => {
      it('should get templates for barber', async () => {
        // Create templates
        await request(app)
          .post('/api/admin/availability/templates')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            barber_id: barberId,
            day_of_week: 1,
            start_time: '09:00',
            end_time: '17:00',
          });

        const response = await request(app)
          .get(`/api/admin/availability/templates/barber/${barberId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('templates');
        expect(Array.isArray(response.body.templates)).toBe(true);
        expect(response.body.templates.length).toBeGreaterThan(0);
      });
    });

    describe('PUT /api/admin/availability/templates/:id', () => {
      it('should update availability template', async () => {
        // Create template
        const createResponse = await request(app)
          .post('/api/admin/availability/templates')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            barber_id: barberId,
            day_of_week: 1,
            start_time: '09:00',
            end_time: '17:00',
          });

        const templateId = createResponse.body.id;

        const response = await request(app)
          .put(`/api/admin/availability/templates/${templateId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            end_time: '18:00',
          })
          .expect(200);

        expect(response.body.end_time).toBe('18:00:00');
      });
    });

    describe('DELETE /api/admin/availability/templates/:id', () => {
      it('should delete availability template', async () => {
        // Create template
        const createResponse = await request(app)
          .post('/api/admin/availability/templates')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            barber_id: barberId,
            day_of_week: 1,
            start_time: '09:00',
            end_time: '17:00',
          });

        const templateId = createResponse.body.id;

        await request(app)
          .delete(`/api/admin/availability/templates/${templateId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      });
    });
  });

  describe('Availability Overrides', () => {
    describe('POST /api/admin/availability/overrides', () => {
      it('should create availability override', async () => {
        const override = {
          barber_id: barberId,
          date: '2024-12-25',
          start_time: null,
          end_time: null,
          is_available: false,
          reason: 'Christmas Holiday',
        };

        const response = await request(app)
          .post('/api/admin/availability/overrides')
          .set('Authorization', `Bearer ${authToken}`)
          .send(override)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.is_available).toBe(false);
        expect(response.body.reason).toBe('Christmas Holiday');
      });

      it('should create override with custom hours', async () => {
        const override = {
          barber_id: barberId,
          date: '2024-12-24',
          start_time: '09:00',
          end_time: '13:00',
          is_available: true,
          reason: 'Half day',
        };

        const response = await request(app)
          .post('/api/admin/availability/overrides')
          .set('Authorization', `Bearer ${authToken}`)
          .send(override)
          .expect(201);

        expect(response.body.start_time).toBe('09:00:00');
        expect(response.body.end_time).toBe('13:00:00');
      });
    });

    describe('GET /api/admin/availability/overrides/barber/:barberId', () => {
      it('should get overrides for barber', async () => {
        // Create override
        await request(app)
          .post('/api/admin/availability/overrides')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            barber_id: barberId,
            date: '2024-12-25',
            start_time: null,
            end_time: null,
            is_available: false,
            reason: 'Holiday',
          });

        const response = await request(app)
          .get(`/api/admin/availability/overrides/barber/${barberId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('overrides');
        expect(Array.isArray(response.body.overrides)).toBe(true);
      });

      it('should filter overrides by date range', async () => {
        const response = await request(app)
          .get(`/api/admin/availability/overrides/barber/${barberId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .query({
            start_date: '2024-12-01',
            end_date: '2024-12-31',
          })
          .expect(200);

        expect(response.body).toHaveProperty('overrides');
      });
    });
  });
});
