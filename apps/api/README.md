# Backend API Service

A NestJS-based backend API service with TypeScript, class-validator, and Swagger/OpenAPI documentation.

## Features

- **Framework**: NestJS with TypeScript
- **Validation**: class-validator with class-transformer
- **Documentation**: Swagger/OpenAPI with interactive docs
- **Health Checks**: Comprehensive health monitoring with NestJS Terminus
- **Logging**: Winston-based structured logging
- **Security**: Helmet, CORS, rate limiting
- **Database**: Prisma ORM (configured, migrations for later ticket)
- **Error Handling**: Global exception filter with proper error responses
- **Architecture**: Layered structure with modules, controllers, services

## Project Structure

```
src/
├── app.module.ts              # Root application module
├── main.ts                    # Application entry point
├── app.controller.ts          # Root controller
├── app.service.ts             # Root service
├── common/                    # Shared utilities
│   ├── filters/               # Exception filters
│   ├── interceptors/          # Response interceptors
│   └── middlewares/           # Custom middleware
├── config/                    # Configuration modules
│   ├── app-config.module.ts
│   ├── app-config.service.ts
│   └── winston.config.ts
├── health/                    # Health check module
│   ├── health.controller.ts
│   ├── health.service.ts
│   └── health.module.ts
├── modules/                   # Feature modules
│   └── users/                 # Example user module
│       ├── users.controller.ts
│       ├── users.service.ts
│       ├── users.module.ts
│       └── dto/
└── database/                  # Database services
    └── prisma.service.ts
```

## Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
# Environment Configuration
NODE_ENV=development
PORT=3000

# CORS Configuration
CORS_ORIGIN=*

# Database Configuration
DATABASE_URL="postgresql://localhost:5432/mydb"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION_TIME=1h

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Logging Configuration
LOG_LEVEL=info
```

## Scripts

- `npm run build` - Build the application
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start in production mode
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## API Endpoints

### Health Checks

- `GET /api/health` - Comprehensive health check
- `GET /api/health/simple` - Simple health check

### Documentation

- `GET /docs` - Swagger UI (development only)

### Example Endpoints

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Docker Support

The application is fully containerized and can be run with Docker Compose:

```bash
# Start all services
docker-compose up

# Start only API service
docker-compose up api

# Build and run in production
docker-compose -f docker-compose.prod.yml up
```

## Development

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run start:dev
   ```

3. Access the API at `http://localhost:3000`
4. Access Swagger docs at `http://localhost:3000/docs`

### Database

Prisma is configured but migrations are deferred to a later ticket. The database service is available for when migrations are ready.

### Testing

Run tests with coverage:
```bash
npm run test:coverage
```

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request throttling
- **Input Validation**: class-validator integration
- **Error Handling**: Sanitized error responses

## Logging

Structured logging with Winston:
- Console output for development
- File logging for production
- Request/response logging middleware
- Error tracking and reporting

## Next Steps

- Database migrations with Prisma
- Authentication and authorization
- Additional feature modules
- API versioning
- Integration testing
- Performance monitoring