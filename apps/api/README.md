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
- `JWT_ACCESS_SECRET` - Secret used to sign JWT access tokens (required in production)
- `JWT_REFRESH_SECRET` - Secret used to sign JWT refresh tokens (required in production)
- `JWT_ACCESS_EXPIRES_IN` - Access token lifetime (e.g. `15m`)
- `JWT_REFRESH_EXPIRES_IN` - Refresh token lifetime (e.g. `7d`)

## Authentication & Authorization

The API now provides a fully in-memory authentication module with password hashing, JWT access/refresh tokens, and role-based access control (admin, manager, staff).

Available endpoints:

- `POST /auth/register` – Bootstrap the first administrator or create additional users when authenticated as an admin
- `POST /auth/login` – Validate credentials and receive an access/refresh token pair
- `POST /auth/refresh` – Rotate the token pair using a valid refresh token
- `POST /auth/logout` – Revoke the provided refresh token (requires authentication)
- `GET /auth/me` – Return the authenticated user profile
- `GET /secure/reports/daily` – Example RBAC-protected route available to managers and administrators
- `GET /secure/admin/audit-log` – Example RBAC-protected route limited to administrators

Interactive API documentation with updated security schemes is available at `/docs` when the server is running.

See [`docs/authentication.md`](../../docs/authentication.md) for a detailed explanation of the token lifecycle, rotation strategy, and production configuration guidelines.
