# Barber Booking API

A comprehensive REST and GraphQL API for barber shop booking management with built-in validation, rate limiting, and transactional booking creation.

## Features

- **REST & GraphQL APIs**: Full CRUD operations for services, barbers, customers, and bookings
- **Smart Booking Logic**: Prevents double bookings with transactional creation
- **Availability Management**: Flexible scheduling with time slot generation
- **Input Validation**: Comprehensive validation using express-validator
- **Rate Limiting**: Multi-tier rate limiting for different endpoint types
- **Database Transactions**: ACID compliance with Prisma ORM
- **Comprehensive Testing**: Unit and integration test coverage
- **API Documentation**: Detailed REST and GraphQL documentation

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm

### Installation

1. Clone and install dependencies:
```bash
cd api
npm install
```

2. Set up environment variables:
```bash
cp ../.env.example .env
# Edit .env with your database configuration
```

3. Set up the database:
```bash
npm run db:migrate
npm run db:seed  # Optional: seed with sample data
```

4. Start the development server:
```bash
npm run dev
```

The API will be available at:
- REST API: http://localhost:3001/api
- GraphQL: http://localhost:3001/graphql
- Health Check: http://localhost:3001/health

## API Endpoints

### REST API
- `GET /api/services` - List all services
- `POST /api/services` - Create new service
- `GET /api/barbers` - List barbers
- `GET /api/customers` - List customers
- `GET /api/bookings` - List bookings with filters
- `POST /api/bookings` - Create booking
- `GET /api/bookings/available-slots` - Get available time slots

### GraphQL
Full GraphQL API with queries and mutations for all entities. Visit `/graphql` for the interactive playground.

## Key Features

### Booking Logic
- **Slot Availability**: Real-time availability checking
- **Double Booking Prevention**: Database constraints and application logic
- **Time Slot Generation**: Automatic 30-minute slot generation based on availability
- **Transactional Creation**: Atomic booking creation with rollback on failure

### Rate Limiting
- **General API**: 100 requests/15 minutes
- **Booking Operations**: 10 requests/15 minutes
- **Customer Operations**: 50 requests/15 minutes
- **Account Creation**: 5 requests/hour

### Validation
- Input sanitization and validation
- UUID format validation
- Date/time validation
- Business logic validation (availability, overlapping bookings)

## Testing

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch
```

Test suites include:
- Booking service logic
- REST API endpoints
- GraphQL queries and mutations
- Rate limiting functionality
- Error handling scenarios

## Database Schema

The API uses Prisma ORM with PostgreSQL. Key models:
- **Service**: Haircut/grooming services with pricing
- **Barber**: Staff members with availability schedules
- **Customer**: Client information
- **Booking**: Appointments with status tracking
- **Availability**: Weekly working hours per barber

## Scripts

- `npm run dev` - Start development server
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

## Security

- SQL injection prevention via Prisma ORM
- Input validation and sanitization
- Rate limiting to prevent abuse
- CORS configuration
- Error message sanitization

## Documentation

See `docs/README.md` for comprehensive API documentation including:
- Complete endpoint reference
- Request/response examples
- Error handling
- GraphQL schema
- Authentication guidelines

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/barber_booking
PORT=3001
NODE_ENV=development
```

## Contributing

1. Follow the existing code style and patterns
2. Add tests for new features
3. Update documentation for API changes
4. Run tests before committing

## License

MIT License