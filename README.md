# Supplier Management Monorepo

A modern full-stack supplier management system built with TypeScript, organized as a monorepo using pnpm workspaces.

## 🏗️ Architecture

This monorepo contains three main applications and shared packages:

### Applications

- **`apps/web`** - Next.js frontend with App Router
- **`apps/api`** - NestJS backend API service  
- **`apps/worker`** - Background worker service for scheduled jobs

### Shared Packages

- **`packages/types-package`** - Shared TypeScript types and interfaces
- **`packages/utils-package`** - Shared utility functions
- **`packages/alerting-service`** - Alerting and notification service

## 🚀 Tech Stack

### Frontend (`apps/web`)
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Mantine UI
- **State Management**: Zustand + React Query
- **Testing**: Vitest + React Testing Library

### API (`apps/api`)
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Testing**: Vitest
- **Documentation**: Swagger/OpenAPI

### Worker (`apps/worker`)
- **Runtime**: Node.js
- **Language**: TypeScript
- **Scheduler**: node-cron
- **Logging**: Winston
- **Testing**: Vitest

## 📋 Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL (for API database)

## 🛠️ Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd supplier-management-monorepo
pnpm install
```

### 2. Environment Configuration

Copy the example environment files and configure them:

```bash
# For API
cp apps/api/.env.example apps/api/.env

# For Worker
cp apps/worker/.env.example apps/worker/.env

# For Web
cp apps/web/.env.example apps/web/.env
```

### 3. Database Setup

The API uses PostgreSQL. Set up your database and run migrations:

```bash
cd apps/api
pnpm prisma migrate dev
pnpm prisma generate
```

### 4. Start Development Services

Start all applications in parallel:

```bash
pnpm dev
```

Or start individual services:

```bash
# Start Next.js frontend (http://localhost:3000)
pnpm --filter @app/web dev

# Start NestJS API (http://localhost:3001)
pnpm --filter @app/api start:dev

# Start Worker service
pnpm --filter @app/worker dev
```

## 📦 Available Scripts

### Root Level Scripts

- `pnpm dev` - Start all applications in development mode
- `pnpm build` - Build all applications and packages
- `pnpm test` - Run all unit tests
- `pnpm test:coverage` - Generate coverage reports
- `pnpm test:e2e` - Run end-to-end tests
- `pnpm lint` - Lint all packages
- `pnpm lint:fix` - Fix linting issues
- `pnpm format` - Format code with Prettier
- `pnpm type-check` - Type check all packages
- `pnpm clean` - Clean all build artifacts and dependencies

### Application-Specific Scripts

Each application has its own set of scripts. See individual `package.json` files for details.

## 🏛️ Project Structure

```
supplier-management-monorepo/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/        # App Router pages
│   │   │   ├── components/ # Reusable components
│   │   │   ├── hooks/      # Custom hooks
│   │   │   ├── lib/        # Utilities
│   │   │   └── types/      # Type definitions
│   │   ├── public/         # Static assets
│   │   └── package.json
│   ├── api/                 # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/    # Feature modules
│   │   │   ├── common/     # Shared modules
│   │   │   ├── config/     # Configuration
│   │   │   └── main.ts     # Application entry
│   │   ├── test/           # Test files
│   │   └── package.json
│   └── worker/              # Background worker
│       ├── src/
│       │   ├── jobs/       # Scheduled jobs
│       │   ├── services/   # Worker services
│       │   ├── config/     # Configuration
│       │   └── index.ts     # Worker entry
│       └── package.json
├── packages/
│   ├── types-package/       # Shared types
│   │   ├── index.ts        # Type exports
│   │   └── package.json
│   ├── utils-package/       # Shared utilities
│   │   ├── index.ts        # Utility exports
│   │   └── package.json
│   └── alerting-service/    # Alerting service
│       └── package.json
├── docs/                    # Documentation
├── .github/                 # GitHub workflows
├── docker-compose.yml       # Local development
├── package.json            # Root package configuration
└── pnpm-workspace.yaml     # Workspace configuration
```

## 🔧 Development Workflow

### Adding New Dependencies

#### Application-Specific Dependencies
```bash
# Add to web app
pnpm --filter @app/web add <package>

# Add to API
pnpm --filter @app/api add <package>

# Add to worker
pnpm --filter @app/worker add <package>
```

#### Shared Dependencies
```bash
# Add to shared utils
pnpm --filter @shared/utils add <package>

# Add to shared types (usually just devDependencies)
pnpm --filter @shared/types add -D <package>
```

### Creating New Packages

1. Create a new directory in `packages/`
2. Add a `package.json` with the appropriate workspace configuration
3. Update the root `package.json` workspaces array
4. Export your package's main functionality from `index.ts`

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @app/web test

# Run tests in watch mode
pnpm --filter @app/api test:watch

# Generate coverage
pnpm test:coverage
```

## 🐳 Docker Support

The monorepo includes Docker configuration for local development and production:

```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📚 API Documentation

When the API service is running, visit:
- **Swagger UI**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health

## 🔒 Environment Variables

### API Environment Variables
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV="development"
```

### Web Environment Variables
```env
# API
NEXT_PUBLIC_API_URL="http://localhost:3001"

# App
NEXT_PUBLIC_APP_NAME="Supplier Management"
```

### Worker Environment Variables
```env
# Logging
LOG_LEVEL="info"

# Database (if needed)
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"
```

## 🧪 Testing Strategy

- **Unit Tests**: Individual function and component tests
- **Integration Tests**: API endpoint and service integration
- **E2E Tests**: Full user journey tests using Playwright
- **Coverage**: Aim for >80% code coverage

## 📈 Monitoring and Logging

- **API**: Structured logging with Winston
- **Worker**: Job execution logging
- **Web**: Browser console and error tracking
- **Health Checks**: Available for all services

## 🚀 Deployment

### Production Build
```bash
# Build all applications
pnpm build

# Start production services
pnpm --filter @app/api start:prod
pnpm --filter @app/web start
pnpm --filter @app/worker start
```

### Docker Deployment
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **Dependency Conflicts**: Run `pnpm install --force` to resolve
2. **Build Failures**: Check TypeScript configuration and dependencies
3. **Database Connection**: Verify PostgreSQL is running and credentials are correct
4. **Port Conflicts**: Ensure ports 3000, 3001 are available

### Getting Help

- Check individual package READMEs for specific guidance
- Review the documentation in the `docs/` directory
- Open an issue for bugs or feature requests