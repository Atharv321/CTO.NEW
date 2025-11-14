const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const http = require('http');
const { makeExecutableSchema } = require('@graphql-tools/schema');

// Import routes and middleware
const servicesRouter = require('./routes/services');
const barbersRouter = require('./routes/barbers');
const customersRouter = require('./routes/customers');
const bookingsRouter = require('./routes/bookings');
const { apiLimiter } = require('./middleware/rateLimiting');

// GraphQL temporarily disabled for debugging
// const typeDefs = require('./graphql/typeDefs');
// const resolvers = require('./graphql/resolvers');

const createApp = async () => {
  const app = express();
  const httpServer = http.createServer(app);

  // GraphQL temporarily disabled for debugging
  /*
  // Create GraphQL schema
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  // Create Apollo Server
  const server = new ApolloServer({
    schema,
  });

  await server.start();
  */

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Apply rate limiting to all API routes
  app.use('/api', apiLimiter);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
  });

  // GraphQL endpoint temporarily disabled
  // app.use('/graphql', expressMiddleware(server));

  // REST API routes
  app.use('/api/services', servicesRouter);
  app.use('/api/barbers', barbersRouter);
  app.use('/api/customers', customersRouter);
  app.use('/api/bookings', bookingsRouter);

  // API documentation endpoint
  app.get('/api', (req, res) => {
    res.json({
      message: 'Barber Booking API',
      version: '1.0.0',
      endpoints: {
        rest: {
          services: '/api/services',
          barbers: '/api/barbers',
          customers: '/api/customers',
          bookings: '/api/bookings',
          availableSlots: '/api/bookings/available-slots'
        },
        graphql: '/graphql'
      },
      documentation: {
        health: '/health',
        restApi: '/api',
        graphqlPlayground: 'Visit /graphql in browser for GraphQL Playground'
      }
    });
  });

  // Error handling middleware
  app.use((error, req, res, next) => {
    console.error('Error:', error);
    
    if (error.name === 'PrismaClientKnownRequestError') {
      return res.status(400).json({
        success: false,
        error: 'Database operation failed',
        details: error.message
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  });

  return { app, httpServer };
};

const startServer = async () => {
  const { app, httpServer } = await createApp();
  
  const PORT = process.env.PORT || 3001;
  
  httpServer.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
    console.log(`REST API base: http://localhost:${PORT}/api`);
  });
};

if (require.main === module) {
  startServer().catch(console.error);
}

module.exports = { createApp };
