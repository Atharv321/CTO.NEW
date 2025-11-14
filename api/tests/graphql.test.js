const request = require('supertest');
const { createApp } = require('../server');

describe('GraphQL API', () => {
  let app;

  beforeAll(async () => {
    const { app: testApp } = await createApp();
    app = testApp;
  });

  describe('Services GraphQL Queries', () => {
    test('should query all services', async () => {
      const query = `
        query {
          services {
            id
            name
            duration
            price
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('services');
      expect(Array.isArray(response.body.data.services)).toBe(true);
    });

    test('should query service by ID', async () => {
      const query = `
        query {
          service(id: "test-id") {
            id
            name
            description
            duration
            price
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('service');
    });
  });

  describe('Barbers GraphQL Queries', () => {
    test('should query all barbers', async () => {
      const query = `
        query {
          barbers {
            id
            name
            email
            isActive
            _count {
              bookings
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('barbers');
      expect(Array.isArray(response.body.data.barbers)).toBe(true);
    });

    test('should query barber by ID', async () => {
      const query = `
        query {
          barber(id: "test-id") {
            id
            name
            email
            bio
            availability {
              dayOfWeek
              startTime
              endTime
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('barber');
    });
  });

  describe('Bookings GraphQL Queries', () => {
    test('should query available slots', async () => {
      const query = `
        query {
          availableSlots(
            barberId: "test-barber-id"
            date: "2024-01-01T00:00:00Z"
            serviceId: "test-service-id"
          ) {
            time
            isAvailable
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('availableSlots');
      expect(Array.isArray(response.body.data.availableSlots)).toBe(true);
    });

    test('should query bookings with filters', async () => {
      const query = `
        query {
          bookings(
            customerId: "test-customer-id"
            status: PENDING
          ) {
            id
            startTime
            endTime
            status
            customer {
              name
              email
            }
            barber {
              name
            }
            service {
              name
              price
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('bookings');
      expect(Array.isArray(response.body.data.bookings)).toBe(true);
    });
  });

  describe('GraphQL Mutations', () => {
    test('should create a new customer', async () => {
      const mutation = `
        mutation {
          createCustomer(input: {
            name: "John Doe"
            email: "john@example.com"
            phone: "+1234567890"
          }) {
            id
            name
            email
            phone
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: mutation })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('createCustomer');
    });

    test('should create a new booking', async () => {
      const mutation = `
        mutation {
          createBooking(input: {
            customerId: "test-customer-id"
            barberId: "test-barber-id"
            serviceId: "test-service-id"
            startTime: "2024-01-01T10:00:00Z"
            notes: "Test booking"
          }) {
            id
            status
            startTime
            endTime
            customer {
              name
            }
            barber {
              name
            }
            service {
              name
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: mutation })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('createBooking');
    });

    test('should handle GraphQL validation errors', async () => {
      const mutation = `
        mutation {
          createBooking(input: {
            customerId: ""
            barberId: ""
            serviceId: ""
            startTime: "invalid-date"
          }) {
            id
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: mutation })
        .expect(200);

      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });
  });

  describe('GraphQL Error Handling', () => {
    test('should handle non-existent resource queries', async () => {
      const query = `
        query {
          service(id: "non-existent-id") {
            id
            name
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.service).toBeNull();
    });

    test('should handle malformed GraphQL queries', async () => {
      const invalidQuery = `
        query {
          services {
            id
            name
            invalid_field
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: invalidQuery })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GraphQL Introspection', () => {
    test('should support GraphQL introspection', async () => {
      const introspectionQuery = `
        query {
          __schema {
            types {
              name
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: introspectionQuery })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('__schema');
      expect(response.body.data.__schema).toHaveProperty('types');
    });
  });
});