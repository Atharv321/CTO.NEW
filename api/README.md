# Barbershop Admin API

Backend API service for managing a barbershop booking system with admin authentication.

## Features

- **Authentication**: JWT-based authentication with password login and magic link support
- **Services Management**: Full CRUD operations for barbershop services
- **Barbers Management**: Manage barber profiles and information
- **Availability Management**: 
  - Recurring weekly availability templates
  - Specific date overrides for holidays/special hours
- **Bookings Management**: 
  - List and filter bookings with pagination
  - Update booking statuses
  - View booking statistics
- **Validation**: Comprehensive request validation using Joi
- **Database**: PostgreSQL with migration system
- **Testing**: Full integration test suite

## Tech Stack

- Node.js + Express
- PostgreSQL
- JWT for authentication
- Joi for validation
- Jest + Supertest for testing
- bcrypt for password hashing

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- npm or yarn

### Installation

```bash
cd api
npm install
```

### Environment Variables

Create a `.env` file in the api directory:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/barbershop

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Server
PORT=3001
NODE_ENV=development
```

### Database Setup

Run migrations and seed the database:

```bash
npm run seed
```

This will:
- Create all necessary database tables
- Create an admin user (email: admin@barbershop.com, password: admin123)
- Create sample barbers and services
- Set up availability templates

### Development

Start the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:3001`

### Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm test -- --watch
```

## API Documentation

See [Admin API Documentation](../docs/admin-api.md) for detailed endpoint documentation.

### Quick Start Example

1. **Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@barbershop.com",
    "password": "admin123"
  }'
```

2. **Use the token for authenticated requests:**
```bash
curl http://localhost:3001/api/admin/services \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Project Structure

```
api/
├── src/
│   ├── db/
│   │   ├── index.js          # Database connection
│   │   └── migrations.js     # Database migrations
│   ├── middleware/
│   │   └── auth.js           # Authentication middleware
│   ├── routes/
│   │   ├── auth.js           # Authentication endpoints
│   │   ├── services.js       # Services CRUD
│   │   ├── barbers.js        # Barbers CRUD
│   │   ├── availability.js   # Availability management
│   │   └── bookings.js       # Bookings management
│   └── validators/
│       └── index.js          # Validation schemas
├── scripts/
│   ├── migrate.js            # Migration runner
│   └── seed.js               # Database seeding
├── tests/
│   ├── setup.js              # Test utilities
│   ├── auth.test.js          # Auth tests
│   ├── services.test.js      # Services tests
│   ├── availability.test.js  # Availability tests
│   └── bookings.test.js      # Bookings tests
├── server.js                 # Main application entry point
└── package.json
```

## Database Schema

### Tables

- **admins**: Admin users for authentication
- **barbers**: Barber profiles
- **services**: Available services (haircut, beard trim, etc.)
- **availability_templates**: Recurring weekly availability schedules
- **availability_overrides**: Specific date availability overrides
- **bookings**: Customer bookings
- **magic_links**: Passwordless authentication tokens
- **migrations**: Migration tracking

## API Endpoints

### Authentication
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/magic-link` - Request magic link
- `POST /api/auth/verify-magic-link` - Verify magic link

### Services (Admin)
- `GET /api/admin/services` - List all services
- `GET /api/admin/services/:id` - Get service by ID
- `POST /api/admin/services` - Create service
- `PUT /api/admin/services/:id` - Update service
- `DELETE /api/admin/services/:id` - Delete service

### Barbers (Admin)
- `GET /api/admin/barbers` - List all barbers
- `GET /api/admin/barbers/:id` - Get barber by ID
- `POST /api/admin/barbers` - Create barber
- `PUT /api/admin/barbers/:id` - Update barber
- `DELETE /api/admin/barbers/:id` - Delete barber

### Availability (Admin)
- `GET /api/admin/availability/templates` - List templates
- `GET /api/admin/availability/templates/barber/:barberId` - Get barber templates
- `POST /api/admin/availability/templates` - Create template
- `PUT /api/admin/availability/templates/:id` - Update template
- `DELETE /api/admin/availability/templates/:id` - Delete template
- `GET /api/admin/availability/overrides` - List overrides
- `GET /api/admin/availability/overrides/barber/:barberId` - Get barber overrides
- `POST /api/admin/availability/overrides` - Create override
- `PUT /api/admin/availability/overrides/:id` - Update override
- `DELETE /api/admin/availability/overrides/:id` - Delete override

### Bookings (Admin)
- `GET /api/admin/bookings` - List bookings (with filtering & pagination)
- `GET /api/admin/bookings/:id` - Get booking by ID
- `PATCH /api/admin/bookings/:id/status` - Update booking status
- `GET /api/admin/bookings/stats/summary` - Get booking statistics

## Validation

All endpoints use Joi schemas for validation. Invalid requests return:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "\"email\" must be a valid email"
    }
  ]
}
```

## Error Handling

Standard HTTP status codes are used:
- `200` - Success
- `201` - Created
- `400` - Validation error
- `401` - Unauthorized
- `404` - Not found
- `409` - Conflict
- `500` - Internal server error

## Security

- Passwords are hashed using bcrypt (10 rounds)
- JWT tokens for authentication
- Magic links expire after 15 minutes
- Input validation on all endpoints
- SQL injection protection via parameterized queries

## Production Deployment

1. Set strong `JWT_SECRET` environment variable
2. Use HTTPS
3. Set `NODE_ENV=production`
4. Use a managed PostgreSQL service
5. Enable rate limiting (not included, consider adding)
6. Set up monitoring and logging
7. Regular security updates

## Contributing

1. Write tests for new features
2. Follow existing code style
3. Update documentation
4. Ensure all tests pass

## License

MIT
