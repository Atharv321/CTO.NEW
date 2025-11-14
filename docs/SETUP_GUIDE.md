# Monorepo Setup Guide

This guide will walk you through setting up the supplier management monorepo for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **PostgreSQL** >= 13 (for local development)
- **Docker** & **Docker Compose** (optional, for containerized development)

### Installing pnpm

If you don't have pnpm installed, you can install it with:

```bash
npm install -g pnpm@8.0.0
```

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd supplier-management-monorepo
```

### 2. Install Dependencies

Install all dependencies for the monorepo:

```bash
pnpm install
```

This will install dependencies for all packages and applications in the workspace.

### 3. Environment Configuration

Copy the example environment files and configure them for your environment:

```bash
# API environment
cp apps/api/.env.example apps/api/.env

# Web environment  
cp apps/web/.env.example apps/web/.env

# Worker environment
cp apps/worker/.env.example apps/worker/.env
```

#### Configure API Environment

Edit `apps/api/.env`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/supplier_management"

# JWT (generate secure random strings for production)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV="development"
```

#### Configure Web Environment

Edit `apps/web/.env`:

```env
# API URL
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Application
NEXT_PUBLIC_APP_NAME="Supplier Management"
NODE_ENV="development"
```

#### Configure Worker Environment

Edit `apps/worker/.env`:

```env
# Logging
LOG_LEVEL="info"
NODE_ENV="development"

# Database (if worker needs DB access)
DATABASE_URL="postgresql://username:password@localhost:5432/supplier_management"
```

### 4. Database Setup

#### Option A: Local PostgreSQL

1. Create a PostgreSQL database:
```sql
CREATE DATABASE supplier_management;
```

2. Run database migrations:
```bash
cd apps/api
pnpm prisma migrate dev
pnpm prisma generate
```

#### Option B: Docker PostgreSQL

Use the provided Docker Compose setup:

```bash
docker-compose up -d postgres
```

Then run migrations as shown above.

## Development Workflow

### Starting All Services

Start all applications in parallel:

```bash
pnpm dev
```

This will start:
- Next.js web app on http://localhost:3000
- NestJS API on http://localhost:3001
- Worker service in the background

### Starting Individual Services

You can also start services individually:

```bash
# Web frontend
pnpm --filter @app/web dev

# API backend
pnpm --filter @app/api start:dev

# Worker service
pnpm --filter @app/worker dev
```

### Building Applications

Build all applications:

```bash
pnpm build
```

Build specific applications:

```bash
pnpm --filter @app/web build
pnpm --filter @app/api build
pnpm --filter @app/worker build
```

## Testing

### Running All Tests

```bash
pnpm test
```

### Running Tests for Specific Packages

```bash
# Web app tests
pnpm --filter @app/web test

# API tests
pnpm --filter @app/api test

# Worker tests
pnpm --filter @app/worker test

# Shared packages tests
pnpm --filter @shared/utils test
```

### Test Coverage

Generate coverage reports:

```bash
pnpm test:coverage
```

### Watch Mode

Run tests in watch mode for development:

```bash
pnpm --filter @app/web test:watch
```

## Code Quality

### Linting

Check all code for linting issues:

```bash
pnpm lint
```

Fix linting issues automatically:

```bash
pnpm lint:fix
```

### Type Checking

Type check all packages:

```bash
pnpm type-check
```

### Formatting

Format all code with Prettier:

```bash
pnpm format
```

## Docker Development

### Using Docker Compose

Start all services with Docker Compose:

```bash
docker-compose up -d
```

View logs:

```bash
docker-compose logs -f
```

Stop services:

```bash
docker-compose down
```

### Building Docker Images

Build all Docker images:

```bash
docker-compose build
```

Build specific service images:

```bash
docker-compose build web
docker-compose build api
docker-compose build worker
```

## Package Management

### Adding Dependencies

#### Application-Specific Dependencies

```bash
# Add to web app
pnpm --filter @app/web add <package-name>

# Add to API
pnpm --filter @app/api add <package-name>

# Add to worker
pnpm --filter @app/worker add <package-name>
```

#### Shared Dependencies

```bash
# Add to shared utils
pnpm --filter @shared/utils add <package-name>

# Add dev dependency to shared types
pnpm --filter @shared/types add -D <package-name>
```

### Updating Dependencies

Update all dependencies:

```bash
pnpm update
```

Update specific package:

```bash
pnpm update <package-name>
```

## Troubleshooting

### Common Issues

#### Dependency Installation Issues

If you encounter dependency conflicts:

```bash
# Clear cache and reinstall
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### Database Connection Issues

1. Ensure PostgreSQL is running
2. Verify database credentials in `.env` files
3. Check if the database exists
4. Run migrations: `pnpm prisma migrate dev`

#### Port Conflicts

If ports are already in use:

1. Stop other services using those ports
2. Or change the ports in your `.env` files

#### Build Failures

1. Check TypeScript configuration
2. Verify all dependencies are installed
3. Run `pnpm type-check` to identify type issues

### Getting Help

1. Check individual package READMEs
2. Review the main README.md
3. Check the documentation in the `docs/` directory
4. Open an issue for bugs or questions

## Development Tips

### Efficient Development

1. Use `pnpm dev` to start all services at once
2. Run `pnpm test:watch` for continuous testing
3. Use `pnpm lint:fix` to automatically fix code style issues
4. Check `pnpm type-check` before committing

### Workspace Commands

Use workspace filters to target specific packages:

```bash
# Run command on all apps
pnpm -r --filter "./apps/*" <command>

# Run command on all packages
pnpm -r --filter "./packages/*" <command>

# Run command on specific package
pnpm --filter @app/web <command>
```

### Environment Variables

Keep your environment variables organized:

- Use `.env.example` files as templates
- Never commit actual `.env` files
- Use different values for development and production
- Generate secure JWT secrets for production

## Next Steps

Once you have the development environment set up:

1. Explore the API documentation at http://localhost:3001/api-docs
2. Check out the web application at http://localhost:3000
3. Review the code structure and shared packages
4. Start building your features!

## Production Deployment

For production deployment considerations, see the main README.md file's deployment section.