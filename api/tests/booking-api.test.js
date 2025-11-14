const request = require('supertest');
const { createApp } = require('../server');

describe('Booking API', () => {
  let app;

  beforeAll(async () => {
    const { app: testApp } = await createApp();
    app = testApp;
  });

  describe('Health Check', () => {
    test('should return OK status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({ status: 'OK' });
    });
  });

  describe('Services API', () => {
    test('should get all services', async () => {
      const response = await request(app)
        .get('/api/services')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should validate service creation', async () => {
      const response = await request(app)
        .post('/api/services')
        .send({
          name: '', // Invalid: empty name
          duration: -10, // Invalid: negative duration
          price: -50 // Invalid: negative price
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('Barbers API', () => {
    test('should get all active barbers', async () => {
      const response = await request(app)
        .get('/api/barbers')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should validate barber creation', async () => {
      const response = await request(app)
        .post('/api/barbers')
        .send({
          name: '', // Invalid: empty name
          email: 'invalid-email' // Invalid: invalid email format
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('Customers API', () => {
    test('should get all customers', async () => {
      const response = await request(app)
        .get('/api/customers')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should validate customer creation', async () => {
      const response = await request(app)
        .post('/api/customers')
        .send({
          name: '', // Invalid: empty name
          email: 'invalid-email' // Invalid: invalid email format
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('Bookings API', () => {
    test('should get available slots with validation', async () => {
      const response = await request(app)
        .get('/api/bookings/available-slots')
        .query({
          barberId: 'invalid-id', // Invalid: not a UUID
          date: 'invalid-date' // Invalid: not ISO 8601
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    test('should validate booking creation', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .send({
          customerId: 'invalid-id', // Invalid: not a UUID
          barberId: 'invalid-id', // Invalid: not a UUID
          serviceId: 'invalid-id', // Invalid: not a UUID
          startTime: 'past-date' // Invalid: past date
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    test('should get bookings with filters', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    test('should apply rate limiting to booking endpoints', async () => {
      // Make multiple rapid requests to trigger rate limiting
      const requests = Array(15).fill().map(() =>
        request(app).get('/api/bookings')
      );

      const responses = await Promise.all(requests);
      
      // At least one request should be rate limited
      const rateLimitedResponse = responses.find(res => res.status === 429);
      expect(rateLimitedResponse).toBeDefined();
      expect(rateLimitedResponse.body).toHaveProperty('error');
    });
  });

  describe('API Documentation', () => {
    test('should return API documentation', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Barber Booking API');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('rest');
      expect(response.body.endpoints).toHaveProperty('graphql');
    });
  });
});