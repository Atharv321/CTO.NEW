# Admin API Documentation

This document describes the admin-authenticated API endpoints for managing the barbershop booking system.

## Table of Contents

- [Authentication](#authentication)
- [Services Management](#services-management)
- [Barbers Management](#barbers-management)
- [Availability Management](#availability-management)
- [Bookings Management](#bookings-management)

## Authentication

All admin endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

### POST /api/auth/login

Authenticate with email and password.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "your-password"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin Name"
  }
}
```

**Error Responses:**
- `400` - Validation failed
- `401` - Invalid credentials

### POST /api/auth/magic-link

Request a magic link for passwordless authentication.

**Request Body:**
```json
{
  "email": "admin@example.com"
}
```

**Response (200):**
```json
{
  "message": "If the email exists, a magic link has been sent",
  "token": "abc123..." // Only in development mode
}
```

### POST /api/auth/verify-magic-link

Verify and authenticate using a magic link token.

**Request Body:**
```json
{
  "token": "abc123..."
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin Name"
  }
}
```

**Error Responses:**
- `401` - Invalid, expired, or used token

---

## Services Management

### GET /api/admin/services

Get all services.

**Response (200):**
```json
{
  "services": [
    {
      "id": 1,
      "name": "Haircut",
      "description": "Standard haircut",
      "duration_minutes": 30,
      "price": "25.00",
      "active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

### GET /api/admin/services/:id

Get a specific service by ID.

**Response (200):**
```json
{
  "id": 1,
  "name": "Haircut",
  "description": "Standard haircut",
  "duration_minutes": 30,
  "price": "25.00",
  "active": true,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `404` - Service not found

### POST /api/admin/services

Create a new service.

**Request Body:**
```json
{
  "name": "Beard Trim",
  "description": "Professional beard trim",
  "duration_minutes": 20,
  "price": 15.00,
  "active": true
}
```

**Response (201):**
```json
{
  "id": 2,
  "name": "Beard Trim",
  "description": "Professional beard trim",
  "duration_minutes": 20,
  "price": "15.00",
  "active": true,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Validation:**
- `name` - Required, 1-255 characters
- `description` - Optional
- `duration_minutes` - Required, positive integer
- `price` - Required, positive decimal
- `active` - Optional, boolean (default: true)

### PUT /api/admin/services/:id

Update an existing service.

**Request Body (all fields optional):**
```json
{
  "name": "Premium Haircut",
  "price": 35.00,
  "active": false
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Premium Haircut",
  "description": "Standard haircut",
  "duration_minutes": 30,
  "price": "35.00",
  "active": false,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T12:00:00.000Z"
}
```

### DELETE /api/admin/services/:id

Delete a service (only if no bookings exist).

**Response (200):**
```json
{
  "message": "Service deleted successfully",
  "service": { /* service data */ }
}
```

**Error Responses:**
- `404` - Service not found
- `409` - Cannot delete service with existing bookings

---

## Barbers Management

### GET /api/admin/barbers

Get all barbers.

**Response (200):**
```json
{
  "barbers": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "555-1234",
      "active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

### GET /api/admin/barbers/:id

Get a specific barber by ID.

### POST /api/admin/barbers

Create a new barber.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "555-5678",
  "active": true
}
```

### PUT /api/admin/barbers/:id

Update an existing barber.

### DELETE /api/admin/barbers/:id

Delete a barber (only if no bookings exist).

---

## Availability Management

### Availability Templates (Recurring Weekly Schedule)

#### GET /api/admin/availability/templates

Get all availability templates.

**Response (200):**
```json
{
  "templates": [
    {
      "id": 1,
      "barber_id": 1,
      "barber_name": "John Doe",
      "day_of_week": 1,
      "start_time": "09:00:00",
      "end_time": "17:00:00",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

**Note:** `day_of_week` is 0-6 (Sunday=0, Monday=1, ..., Saturday=6)

#### GET /api/admin/availability/templates/barber/:barberId

Get availability templates for a specific barber.

#### POST /api/admin/availability/templates

Create a recurring availability template.

**Request Body:**
```json
{
  "barber_id": 1,
  "day_of_week": 1,
  "start_time": "09:00",
  "end_time": "17:00"
}
```

**Validation:**
- `barber_id` - Required, must exist
- `day_of_week` - Required, 0-6
- `start_time` - Required, HH:MM format
- `end_time` - Required, HH:MM format, must be after start_time

#### PUT /api/admin/availability/templates/:id

Update an availability template.

**Request Body (all fields optional):**
```json
{
  "start_time": "08:00",
  "end_time": "18:00"
}
```

#### DELETE /api/admin/availability/templates/:id

Delete an availability template.

### Availability Overrides (Specific Dates)

#### GET /api/admin/availability/overrides

Get all availability overrides.

**Query Parameters:**
- `start_date` - Optional, ISO date (YYYY-MM-DD)
- `end_date` - Optional, ISO date (YYYY-MM-DD)

**Response (200):**
```json
{
  "overrides": [
    {
      "id": 1,
      "barber_id": 1,
      "barber_name": "John Doe",
      "date": "2024-12-25",
      "start_time": null,
      "end_time": null,
      "is_available": false,
      "reason": "Christmas Holiday",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

#### GET /api/admin/availability/overrides/barber/:barberId

Get availability overrides for a specific barber.

**Query Parameters:**
- `start_date` - Optional
- `end_date` - Optional

#### POST /api/admin/availability/overrides

Create an availability override for a specific date.

**Request Body (Day Off):**
```json
{
  "barber_id": 1,
  "date": "2024-12-25",
  "start_time": null,
  "end_time": null,
  "is_available": false,
  "reason": "Holiday"
}
```

**Request Body (Custom Hours):**
```json
{
  "barber_id": 1,
  "date": "2024-12-24",
  "start_time": "09:00",
  "end_time": "13:00",
  "is_available": true,
  "reason": "Half day"
}
```

**Validation:**
- `barber_id` - Required, must exist
- `date` - Required, ISO date
- `start_time` - Optional (null for unavailable days)
- `end_time` - Optional (null for unavailable days)
- `is_available` - Required, boolean
- `reason` - Optional, up to 255 characters

#### PUT /api/admin/availability/overrides/:id

Update an availability override.

#### DELETE /api/admin/availability/overrides/:id

Delete an availability override.

---

## Bookings Management

### GET /api/admin/bookings

List and filter bookings with pagination.

**Query Parameters:**
- `barber_id` - Optional, filter by barber
- `service_id` - Optional, filter by service
- `status` - Optional, one of: `pending`, `confirmed`, `cancelled`, `completed`, `no_show`
- `start_date` - Optional, ISO date
- `end_date` - Optional, ISO date
- `page` - Optional, default: 1
- `limit` - Optional, default: 20, max: 100

**Response (200):**
```json
{
  "bookings": [
    {
      "id": 1,
      "barber_id": 1,
      "barber_name": "John Doe",
      "service_id": 1,
      "service_name": "Haircut",
      "duration_minutes": 30,
      "price": "25.00",
      "customer_name": "Jane Smith",
      "customer_email": "jane@example.com",
      "customer_phone": "555-1234",
      "booking_date": "2024-12-01",
      "start_time": "10:00:00",
      "end_time": "10:30:00",
      "status": "confirmed",
      "notes": "Please use scissors only",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### GET /api/admin/bookings/:id

Get a specific booking by ID.

**Response (200):**
```json
{
  "id": 1,
  "barber_id": 1,
  "barber_name": "John Doe",
  "service_id": 1,
  "service_name": "Haircut",
  "duration_minutes": 30,
  "price": "25.00",
  "customer_name": "Jane Smith",
  "customer_email": "jane@example.com",
  "customer_phone": "555-1234",
  "booking_date": "2024-12-01",
  "start_time": "10:00:00",
  "end_time": "10:30:00",
  "status": "confirmed",
  "notes": "Please use scissors only",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### PATCH /api/admin/bookings/:id/status

Update the status of a booking.

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Valid Statuses:**
- `pending` - Initial state
- `confirmed` - Booking confirmed
- `cancelled` - Customer cancelled
- `completed` - Service completed
- `no_show` - Customer didn't show up

**Response (200):**
```json
{
  "id": 1,
  "status": "confirmed",
  // ... other booking fields
}
```

### GET /api/admin/bookings/stats/summary

Get booking statistics.

**Query Parameters:**
- `start_date` - Optional, ISO date
- `end_date` - Optional, ISO date

**Response (200):**
```json
{
  "total_bookings": 100,
  "pending": 15,
  "confirmed": 45,
  "completed": 30,
  "cancelled": 8,
  "no_show": 2,
  "total_revenue": "3500.00"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
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

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "Conflict",
  "message": "Resource already exists or conflict with existing data"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

Currently, no rate limiting is enforced. In production, consider implementing rate limiting to prevent abuse.

## CORS

The API supports CORS for cross-origin requests. Ensure your frontend domain is properly configured.

## Security Best Practices

1. **Always use HTTPS** in production
2. **Rotate JWT secrets** regularly
3. **Set appropriate token expiration** (default: 24h)
4. **Validate all input** on both client and server
5. **Use strong passwords** and encourage 2FA
6. **Monitor for suspicious activity**
7. **Keep dependencies updated**

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Server
PORT=3001
NODE_ENV=production
```
