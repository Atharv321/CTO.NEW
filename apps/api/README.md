# API Service

Backend API service built with Express.js

## Getting Started

```bash
# Install dependencies
pnpm install

# Development
pnpm run dev

# Build
pnpm run build

# Production
pnpm run start

# Tests
pnpm run test

# Type checking
pnpm run type-check
```

## Environment Variables

See `.env.example` in the root directory.

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `API_PORT` - Port to run the API on (default: 3000)
- `NODE_ENV` - Environment (development/production)
