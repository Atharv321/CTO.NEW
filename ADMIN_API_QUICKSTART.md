# Admin API Quick Start Guide

This guide will help you quickly set up and test the Admin API for the barbershop booking system.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 13+ running (or use Docker Compose)
- curl or an HTTP client (Postman, Insomnia, etc.)

## Quick Setup (5 minutes)

### 1. Start PostgreSQL (if using Docker)

```bash
docker-compose up -d db
```

Or use the full stack:
```bash
docker-compose up -d
```

### 2. Set up the API

```bash
cd api
npm install
npm run seed
```

This will:
- Install all dependencies
- Run database migrations
- Create an admin user
- Populate sample data (barbers, services)

### 3. Start the API

```bash
npm start
```

The API will be running at `http://localhost:3001`

## Test the API (2 minutes)

### 1. Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@barbershop.com","password":"admin123"}'
```

Copy the `token` from the response.

### 2. List Services (replace TOKEN with your actual token)

```bash
curl http://localhost:3001/api/admin/services \
  -H "Authorization: Bearer TOKEN"
```

### 3. Create a New Service

```bash
curl -X POST http://localhost:3001/api/admin/services \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Deluxe Haircut",
    "description": "Premium haircut with styling",
    "duration_minutes": 45,
    "price": 40.00,
    "active": true
  }'
```

## What's Available

### Endpoints

- **Authentication**
  - `POST /api/auth/login` - Login with email/password
  - `POST /api/auth/magic-link` - Request magic link
  - `POST /api/auth/verify-magic-link` - Verify magic link

- **Services** (CRUD)
  - `GET /api/admin/services` - List all
  - `POST /api/admin/services` - Create
  - `PUT /api/admin/services/:id` - Update
  - `DELETE /api/admin/services/:id` - Delete

- **Barbers** (CRUD)
  - `GET /api/admin/barbers` - List all
  - `POST /api/admin/barbers` - Create
  - `PUT /api/admin/barbers/:id` - Update
  - `DELETE /api/admin/barbers/:id` - Delete

- **Availability**
  - Templates: `/api/admin/availability/templates` (recurring schedule)
  - Overrides: `/api/admin/availability/overrides` (specific dates)

- **Bookings**
  - `GET /api/admin/bookings` - List with filtering and pagination
  - `PATCH /api/admin/bookings/:id/status` - Update status
  - `GET /api/admin/bookings/stats/summary` - Statistics

### Default Credentials

- **Email**: admin@barbershop.com
- **Password**: admin123

### Sample Data Included

After running `npm run seed`:
- 1 admin user
- 2 barbers (Mike Johnson, Sarah Williams)
- 5 services (Haircut, Beard Trim, etc.)
- Availability templates for both barbers

## Next Steps

1. **Read the Full Documentation**
   - API Documentation: `docs/admin-api.md`
   - API Examples: `docs/api-examples.md`
   - API README: `api/README.md`

2. **Run Tests**
   ```bash
   cd api
   npm test
   ```

3. **Create Your Own Admin**
   ```bash
   npm run create-admin your@email.com yourpassword "Your Name"
   ```

4. **Development Mode**
   ```bash
   npm run dev  # Auto-restarts on file changes
   ```

## Common Tasks

### Reset Database
```bash
# Stop API, then:
cd api
npm run seed  # This will clear and re-seed
```

### View Logs
```bash
# If using Docker Compose:
docker-compose logs -f api
```

### Test a Complete Flow
```bash
# See docs/api-examples.md for complete testing examples
```

## Troubleshooting

### "Connection refused" error
- Make sure PostgreSQL is running
- Check DATABASE_URL in your .env file

### "401 Unauthorized"
- Make sure you're including the Authorization header
- Check that your token hasn't expired (24h default)

### "Validation failed"
- Check the error details in the response
- Verify all required fields are included
- See docs/admin-api.md for field requirements

## Architecture Overview

```
api/
├── src/
│   ├── db/              # Database connection & migrations
│   ├── middleware/      # Authentication middleware
│   ├── routes/          # API endpoints
│   └── validators/      # Request validation schemas
├── tests/               # Integration tests
├── scripts/             # Utility scripts (seed, migrate)
└── server.js           # Main entry point
```

## Security Notes

⚠️ **For Development Only**
- Change default admin password in production
- Set a strong JWT_SECRET environment variable
- Use HTTPS in production
- Enable rate limiting for production use

## Support

For detailed information:
- **Full API Docs**: [docs/admin-api.md](docs/admin-api.md)
- **Examples**: [docs/api-examples.md](docs/api-examples.md)
- **API README**: [api/README.md](api/README.md)

---

**Quick Reference Card**

| Task | Command |
|------|---------|
| Install | `cd api && npm install` |
| Setup DB | `npm run seed` |
| Start | `npm start` |
| Dev Mode | `npm run dev` |
| Test | `npm test` |
| Migrate | `npm run migrate` |
| Create Admin | `npm run create-admin` |

**Default Login**: admin@barbershop.com / admin123  
**Base URL**: http://localhost:3001  
**Auth Header**: `Authorization: Bearer <token>`
