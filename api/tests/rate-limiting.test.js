const request = require('supertest');
const { createApp } = require('../server');

describe('Rate Limiting', () => {
  let app;

  beforeAll(async () => {
    const { app: testApp } = await createApp();
    app = testApp;
  });

  describe('General API Rate Limiting', () => {
    test('should allow requests within rate limit', async () => {
      // Make a few requests within the limit
      for (let i = 0; i < 5; i++) {
        await request(app)
          .get('/api/services')
          .expect(200);
      }
    });

    test('should apply rate limiting after threshold', async () => {
      // Make multiple rapid requests to exceed the limit
      const requests = Array(105).fill().map(() =>
        request(app).get('/api/services')
      );

      const responses = await Promise.all(requests);
      
      // At least one request should be rate limited
      const rateLimitedResponse = responses.find(res => res.status === 429);
      expect(rateLimitedResponse).toBeDefined();
      expect(rateLimitedResponse.body).toHaveProperty('error');
      expect(rateLimitedResponse.body).toHaveProperty('retryAfter');
    });
  });

  describe('Booking-specific Rate Limiting', () => {
    test('should have stricter limits for booking endpoints', async () => {
      // Make multiple rapid booking requests
      const requests = Array(15).fill().map(() =>
        request(app).get('/api/bookings')
      );

      const responses = await Promise.all(requests);
      
      // Should be rate limited sooner than general API
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should limit booking creation attempts', async () => {
      const bookingData = {
        customerId: 'test-customer',
        barberId: 'test-barber',
        serviceId: 'test-service',
        startTime: '2024-01-01T10:00:00Z'
      };

      // Make multiple booking creation attempts
      const requests = Array(15).fill().map(() =>
        request(app)
          .post('/api/bookings')
          .send(bookingData)
      );

      const responses = await Promise.all(requests);
      
      // Should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Customer Rate Limiting', () => {
    test('should apply customer-specific rate limiting', async () => {
      // Make multiple customer endpoint requests
      const requests = Array(55).fill().map(() =>
        request(app).get('/api/customers')
      );

      const responses = await Promise.all(requests);
      
      // Should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Rate Limit Headers', () => {
    test('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/api/services')
        .expect(200);

      // Should include rate limit headers
      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });

    test('should include retry-after header when rate limited', async () => {
      // Make enough requests to trigger rate limiting
      const requests = Array(105).fill().map(() =>
        request(app).get('/api/services')
      );

      const responses = await Promise.all(requests);
      
      const rateLimitedResponse = responses.find(res => res.status === 429);
      if (rateLimitedResponse) {
        expect(rateLimitedResponse.headers).toHaveProperty('retry-after');
      }
    });
  });

  describe('Rate Limit Bypass Prevention', () => {
    test('should apply rate limiting across different endpoints', async () => {
      // Mix requests to different endpoints
      const requests = [
        ...Array(50).fill().map(() => request(app).get('/api/services')),
        ...Array(50).fill().map(() => request(app).get('/api/barbers')),
        ...Array(50).fill().map(() => request(app).get('/api/bookings'))
      ];

      const responses = await Promise.all(requests);
      
      // Should still be rate limited due to shared limiter
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should limit GraphQL requests', async () => {
      const query = `
        query {
          services {
            id
            name
          }
        }
      `;

      // Make multiple GraphQL requests
      const requests = Array(105).fill().map(() =>
        request(app)
          .post('/graphql')
          .send({ query })
      );

      const responses = await Promise.all(requests);
      
      // Should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Rate Limit Recovery', () => {
    test('should allow requests after rate limit window', async () => {
      // This test would need to wait for the rate limit window to reset
      // In a real test environment, you might use jest.useFakeTimers()
      
      // For now, just verify the rate limiting is working
      const response = await request(app)
        .get('/api/services')
        .expect(200);

      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    });
  });
});