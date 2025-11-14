const request = require('supertest');
const app = require('../server');
const { setupTestDatabase, cleanupTestDatabase } = require('./setup');
const { runMigrations } = require('../src/db/migrations');
const db = require('../src/db');

describe('Bookings API', () => {
  let authToken;
  let barberId;
  let serviceId;

  beforeAll(async () => {
    await runMigrations();
  });

  beforeEach(async () => {
    const testData = await setupTestDatabase();
    barberId = testData.barberId;
    serviceId = testData.serviceId;

    // Login to get auth token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'testpassword',
      });
    authToken = response.body.token;

    // Create some test bookings
    await db.query(
      `INSERT INTO bookings (barber_id, service_id, customer_name, customer_email, customer_phone, booking_date, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [barberId, serviceId, 'John Smith', 'john@example.com', '555-1234', '2024-12-01', '10:00', '10:30', 'pending']
    );

    await db.query(
      `INSERT INTO bookings (barber_id, service_id, customer_name, customer_email, customer_phone, booking_date, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [barberId, serviceId, 'Jane Doe', 'jane@example.com', '555-5678', '2024-12-02', '14:00', '14:30', 'confirmed']
    );
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  describe('GET /api/admin/bookings', () => {
    it('should get all bookings with pagination', async () => {
      const response = await request(app)
        .get('/api/admin/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('bookings');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.bookings)).toBe(true);
      expect(response.body.bookings.length).toBeGreaterThan(0);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('totalPages');
    });

    it('should filter bookings by status', async () => {
      const response = await request(app)
        .get('/api/admin/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'confirmed' })
        .expect(200);

      expect(response.body.bookings.length).toBeGreaterThan(0);
      response.body.bookings.forEach((booking) => {
        expect(booking.status).toBe('confirmed');
      });
    });

    it('should filter bookings by barber', async () => {
      const response = await request(app)
        .get('/api/admin/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ barber_id: barberId })
        .expect(200);

      expect(response.body.bookings.length).toBeGreaterThan(0);
      response.body.bookings.forEach((booking) => {
        expect(booking.barber_id).toBe(barberId);
      });
    });

    it('should filter bookings by date range', async () => {
      const response = await request(app)
        .get('/api/admin/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          start_date: '2024-12-01',
          end_date: '2024-12-01',
        })
        .expect(200);

      expect(response.body.bookings.length).toBeGreaterThan(0);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/admin/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 1 })
        .expect(200);

      expect(response.body.bookings.length).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.hasNext).toBe(true);
    });

    it('should reject without auth', async () => {
      await request(app)
        .get('/api/admin/bookings')
        .expect(401);
    });
  });

  describe('GET /api/admin/bookings/:id', () => {
    it('should get booking by id', async () => {
      // Get a booking first
      const listResponse = await request(app)
        .get('/api/admin/bookings')
        .set('Authorization', `Bearer ${authToken}`);

      const bookingId = listResponse.body.bookings[0].id;

      const response = await request(app)
        .get(`/api/admin/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', bookingId);
      expect(response.body).toHaveProperty('customer_name');
      expect(response.body).toHaveProperty('barber_name');
      expect(response.body).toHaveProperty('service_name');
    });

    it('should return 404 for non-existent booking', async () => {
      await request(app)
        .get('/api/admin/bookings/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/admin/bookings/:id/status', () => {
    it('should update booking status', async () => {
      // Get a booking first
      const listResponse = await request(app)
        .get('/api/admin/bookings')
        .set('Authorization', `Bearer ${authToken}`);

      const bookingId = listResponse.body.bookings[0].id;

      const response = await request(app)
        .patch(`/api/admin/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'confirmed' })
        .expect(200);

      expect(response.body.status).toBe('confirmed');
    });

    it('should reject invalid status', async () => {
      const listResponse = await request(app)
        .get('/api/admin/bookings')
        .set('Authorization', `Bearer ${authToken}`);

      const bookingId = listResponse.body.bookings[0].id;

      await request(app)
        .patch(`/api/admin/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'invalid_status' })
        .expect(400);
    });
  });

  describe('GET /api/admin/bookings/stats/summary', () => {
    it('should get booking statistics', async () => {
      const response = await request(app)
        .get('/api/admin/bookings/stats/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total_bookings');
      expect(response.body).toHaveProperty('pending');
      expect(response.body).toHaveProperty('confirmed');
      expect(response.body).toHaveProperty('completed');
      expect(response.body).toHaveProperty('cancelled');
      expect(response.body).toHaveProperty('no_show');
    });

    it('should filter statistics by date range', async () => {
      const response = await request(app)
        .get('/api/admin/bookings/stats/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          start_date: '2024-12-01',
          end_date: '2024-12-31',
        })
        .expect(200);

      expect(response.body).toHaveProperty('total_bookings');
    });
  });
});
