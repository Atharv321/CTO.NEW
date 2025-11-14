# Admin API Examples

This document provides practical examples for testing the Admin API using curl or any HTTP client.

## Setup

1. Start the API server:
```bash
cd api
npm run seed  # Run this once to set up database
npm start
```

2. The API will be available at `http://localhost:3001`

## Authentication

### 1. Login with Password

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@barbershop.com",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "email": "admin@barbershop.com",
    "name": "Admin User"
  }
}
```

Save the token for authenticated requests.

### 2. Request Magic Link

```bash
curl -X POST http://localhost:3001/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@barbershop.com"
  }'
```

**Response (development mode):**
```json
{
  "message": "If the email exists, a magic link has been sent",
  "token": "abc123def456..."
}
```

### 3. Verify Magic Link

```bash
curl -X POST http://localhost:3001/api/auth/verify-magic-link \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123def456..."
  }'
```

## Services Management

Export your token for convenience:
```bash
export TOKEN="your-jwt-token-here"
```

### List All Services

```bash
curl http://localhost:3001/api/admin/services \
  -H "Authorization: Bearer $TOKEN"
```

### Get Service by ID

```bash
curl http://localhost:3001/api/admin/services/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Create Service

```bash
curl -X POST http://localhost:3001/api/admin/services \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Haircut",
    "description": "Deluxe haircut with styling consultation",
    "duration_minutes": 45,
    "price": 40.00,
    "active": true
  }'
```

### Update Service

```bash
curl -X PUT http://localhost:3001/api/admin/services/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Haircut",
    "price": 30.00
  }'
```

### Delete Service

```bash
curl -X DELETE http://localhost:3001/api/admin/services/1 \
  -H "Authorization: Bearer $TOKEN"
```

## Barbers Management

### List All Barbers

```bash
curl http://localhost:3001/api/admin/barbers \
  -H "Authorization: Bearer $TOKEN"
```

### Create Barber

```bash
curl -X POST http://localhost:3001/api/admin/barbers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "john@barbershop.com",
    "phone": "555-1234",
    "active": true
  }'
```

### Update Barber

```bash
curl -X PUT http://localhost:3001/api/admin/barbers/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith Jr.",
    "active": false
  }'
```

## Availability Management

### Availability Templates (Recurring Schedule)

#### List All Templates

```bash
curl http://localhost:3001/api/admin/availability/templates \
  -H "Authorization: Bearer $TOKEN"
```

#### Get Templates for Specific Barber

```bash
curl http://localhost:3001/api/admin/availability/templates/barber/1 \
  -H "Authorization: Bearer $TOKEN"
```

#### Create Template (Monday 9am-5pm)

```bash
curl -X POST http://localhost:3001/api/admin/availability/templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "barber_id": 1,
    "day_of_week": 1,
    "start_time": "09:00",
    "end_time": "17:00"
  }'
```

**Note:** day_of_week: 0=Sunday, 1=Monday, ..., 6=Saturday

#### Update Template

```bash
curl -X PUT http://localhost:3001/api/admin/availability/templates/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "end_time": "18:00"
  }'
```

#### Delete Template

```bash
curl -X DELETE http://localhost:3001/api/admin/availability/templates/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Availability Overrides (Specific Dates)

#### List All Overrides

```bash
curl http://localhost:3001/api/admin/availability/overrides \
  -H "Authorization: Bearer $TOKEN"
```

#### Filter Overrides by Date Range

```bash
curl "http://localhost:3001/api/admin/availability/overrides?start_date=2024-12-01&end_date=2024-12-31" \
  -H "Authorization: Bearer $TOKEN"
```

#### Create Override - Day Off

```bash
curl -X POST http://localhost:3001/api/admin/availability/overrides \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "barber_id": 1,
    "date": "2024-12-25",
    "start_time": null,
    "end_time": null,
    "is_available": false,
    "reason": "Christmas Holiday"
  }'
```

#### Create Override - Custom Hours

```bash
curl -X POST http://localhost:3001/api/admin/availability/overrides \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "barber_id": 1,
    "date": "2024-12-24",
    "start_time": "09:00",
    "end_time": "13:00",
    "is_available": true,
    "reason": "Half day - Christmas Eve"
  }'
```

## Bookings Management

### List All Bookings (with Pagination)

```bash
curl "http://localhost:3001/api/admin/bookings?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### Filter Bookings by Status

```bash
curl "http://localhost:3001/api/admin/bookings?status=pending" \
  -H "Authorization: Bearer $TOKEN"
```

### Filter by Barber

```bash
curl "http://localhost:3001/api/admin/bookings?barber_id=1" \
  -H "Authorization: Bearer $TOKEN"
```

### Filter by Service

```bash
curl "http://localhost:3001/api/admin/bookings?service_id=1" \
  -H "Authorization: Bearer $TOKEN"
```

### Filter by Date Range

```bash
curl "http://localhost:3001/api/admin/bookings?start_date=2024-12-01&end_date=2024-12-31" \
  -H "Authorization: Bearer $TOKEN"
```

### Combined Filters with Pagination

```bash
curl "http://localhost:3001/api/admin/bookings?barber_id=1&status=confirmed&start_date=2024-12-01&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Single Booking

```bash
curl http://localhost:3001/api/admin/bookings/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Update Booking Status

```bash
curl -X PATCH http://localhost:3001/api/admin/bookings/1/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed"
  }'
```

**Valid statuses:** pending, confirmed, cancelled, completed, no_show

### Get Booking Statistics

```bash
curl http://localhost:3001/api/admin/bookings/stats/summary \
  -H "Authorization: Bearer $TOKEN"
```

### Filter Statistics by Date Range

```bash
curl "http://localhost:3001/api/admin/bookings/stats/summary?start_date=2024-12-01&end_date=2024-12-31" \
  -H "Authorization: Bearer $TOKEN"
```

## Using with Postman/Insomnia

### Setup

1. Import the base URL: `http://localhost:3001`
2. Create an environment variable `token` for your JWT
3. Add to all authenticated requests: 
   - Header: `Authorization`
   - Value: `Bearer {{token}}`

### Workflow

1. First, call `POST /api/auth/login` with your credentials
2. Copy the `token` from the response
3. Save it as an environment variable
4. All subsequent requests will use that token automatically

## Testing Flow

Here's a complete testing flow:

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@barbershop.com","password":"admin123"}' \
  | jq -r '.token')

# 2. Create a service
SERVICE_ID=$(curl -X POST http://localhost:3001/api/admin/services \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Cut","description":"Test","duration_minutes":30,"price":25}' \
  | jq -r '.id')

# 3. List services
curl http://localhost:3001/api/admin/services \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. Create availability template
curl -X POST http://localhost:3001/api/admin/availability/templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"barber_id":1,"day_of_week":1,"start_time":"09:00","end_time":"17:00"}' | jq

# 5. List bookings
curl http://localhost:3001/api/admin/bookings \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Error Handling Examples

### 401 Unauthorized (No Token)

```bash
curl http://localhost:3001/api/admin/services
```

Response:
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authorization header"
}
```

### 400 Validation Error

```bash
curl -X POST http://localhost:3001/api/admin/services \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}'
```

Response:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "duration_minutes",
      "message": "\"duration_minutes\" is required"
    },
    {
      "field": "price",
      "message": "\"price\" is required"
    }
  ]
}
```

### 404 Not Found

```bash
curl http://localhost:3001/api/admin/services/99999 \
  -H "Authorization: Bearer $TOKEN"
```

Response:
```json
{
  "error": "Not found",
  "message": "Service not found"
}
```
