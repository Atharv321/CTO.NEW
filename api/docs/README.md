# Barber Booking API Documentation

## Overview

The Barber Booking API provides comprehensive REST and GraphQL endpoints for managing barber shop bookings, services, barbers, and customers. The API includes robust validation, rate limiting, and transactional booking creation to ensure data integrity and prevent double bookings.

## Base URL

```
Development: http://localhost:3001
```

## Authentication

Currently, the API uses rate limiting for protection. JWT authentication can be added in future versions.

## Rate Limiting

Different endpoints have different rate limits:

- **General API**: 100 requests per 15 minutes per IP
- **Booking Operations**: 10 requests per 15 minutes per IP  
- **Customer Operations**: 50 requests per 15 minutes per IP
- **Account Creation**: 5 requests per hour per IP

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit window resets
- `Retry-After`: Seconds to wait when rate limited (429 responses)

## REST API Endpoints

### Services

#### Get All Services
```http
GET /api/services
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "service_id",
      "name": "Haircut",
      "description": "Standard haircut",
      "duration": 30,
      "price": 25.00,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Get Service by ID
```http
GET /api/services/{id}
```

#### Create Service
```http
POST /api/services
Content-Type: application/json

{
  "name": "Beard Trim",
  "description": "Beard trimming and shaping",
  "duration": 15,
  "price": 15.00
}
```

#### Update Service
```http
PUT /api/services/{id}
Content-Type: application/json

{
  "name": "Updated Service Name",
  "description": "Updated description",
  "duration": 45,
  "price": 35.00
}
```

#### Delete Service
```http
DELETE /api/services/{id}
```

### Barbers

#### Get All Barbers
```http
GET /api/barbers?includeInactive=false
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "barber_id",
      "name": "John Smith",
      "email": "john@example.com",
      "phone": "+1234567890",
      "bio": "Experienced barber",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "availability": [...],
      "_count": {
        "bookings": 5
      }
    }
  ]
}
```

#### Get Barber by ID
```http
GET /api/barbers/{id}
```

#### Create Barber
```http
POST /api/barbers
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "bio": "Specialist in modern cuts"
}
```

#### Update Barber
```http
PUT /api/barbers/{id}
Content-Type: application/json

{
  "name": "Updated Name",
  "isActive": false
}
```

#### Delete Barber
```http
DELETE /api/barbers/{id}
```

### Customers

#### Get All Customers
```http
GET /api/customers
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "customer_id",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "phone": "+1234567890",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "_count": {
        "bookings": 3
      }
    }
  ]
}
```

#### Get Customer by ID
```http
GET /api/customers/{id}
```

#### Create Customer
```http
POST /api/customers
Content-Type: application/json

{
  "name": "Bob Wilson",
  "email": "bob@example.com",
  "phone": "+1234567890"
}
```

#### Update Customer
```http
PUT /api/customers/{id}
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "+1987654321"
}
```

#### Delete Customer
```http
DELETE /api/customers/{id}
```

### Bookings

#### Get Available Slots
```http
GET /api/bookings/available-slots?barberId={barberId}&date={date}&serviceId={serviceId}
```

**Query Parameters:**
- `barberId` (required): Barber UUID
- `date` (required): ISO 8601 date
- `serviceId` (optional): Service UUID for duration calculation

**Response:**
```json
{
  "success": true,
  "data": {
    "barberId": "barber_id",
    "date": "2024-01-01",
    "serviceDuration": 30,
    "availableSlots": [
      "2024-01-01T09:00:00Z",
      "2024-01-01T09:30:00Z",
      "2024-01-01T10:00:00Z"
    ]
  }
}
```

#### Get Bookings
```http
GET /api/bookings?customerId={customerId}&barberId={barberId}&status={status}&date={date}
```

**Query Parameters:**
- `customerId` (optional): Customer UUID
- `barberId` (optional): Barber UUID
- `status` (optional): PENDING, CONFIRMED, CANCELLED, COMPLETED
- `date` (optional): ISO 8601 date

#### Get Booking by ID
```http
GET /api/bookings/{id}
```

#### Create Booking
```http
POST /api/bookings
Content-Type: application/json

{
  "customerId": "customer_id",
  "barberId": "barber_id",
  "serviceId": "service_id",
  "startTime": "2024-01-01T10:00:00Z",
  "notes": "First time customer"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "booking_id",
    "customer": {...},
    "barber": {...},
    "service": {...},
    "startTime": "2024-01-01T10:00:00Z",
    "endTime": "2024-01-01T10:30:00Z",
    "status": "PENDING",
    "notes": "First time customer",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Update Booking Status
```http
PUT /api/bookings/{id}/status
Content-Type: application/json

{
  "status": "CONFIRMED"
}
```

#### Cancel Booking
```http
DELETE /api/bookings/{id}?customerId={customerId}
```

**Query Parameters:**
- `customerId` (optional): Customer UUID for authorization

## GraphQL API

### Endpoint
```
POST /graphql
```

### Schema Types

#### Service
```graphql
type Service {
  id: String!
  name: String!
  description: String
  duration: Int!
  price: Float!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

#### Barber
```graphql
type Barber {
  id: String!
  name: String!
  email: String!
  phone: String
  bio: String
  isActive: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  availability: [Availability!]!
  _count: BarberCount!
}
```

#### Customer
```graphql
type Customer {
  id: String!
  name: String!
  email: String!
  phone: String
  createdAt: DateTime!
  updatedAt: DateTime!
  _count: CustomerCount!
}
```

#### Booking
```graphql
type Booking {
  id: String!
  customer: Customer!
  barber: Barber!
  service: Service!
  startTime: DateTime!
  endTime: DateTime!
  status: BookingStatus!
  notes: String
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### Example Queries

#### Get Available Slots
```graphql
query GetAvailableSlots($barberId: String!, $date: DateTime!, $serviceId: String) {
  availableSlots(barberId: $barberId, date: $date, serviceId: $serviceId) {
    time
    isAvailable
  }
}
```

#### Create Booking
```graphql
mutation CreateBooking($input: CreateBookingInput!) {
  createBooking(input: $input) {
    id
    status
    startTime
    endTime
    customer {
      name
      email
    }
    barber {
      name
    }
    service {
      name
      price
    }
  }
}
```

## Error Handling

### Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (if available)"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `409`: Conflict (double booking)
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

### Validation Errors
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

## Database Schema

The API uses Prisma ORM with PostgreSQL. Key entities:

- **Services**: Haircut and grooming services with duration and pricing
- **Barbers**: Staff members with availability schedules
- **Customers**: Client information
- **Bookings**: Appointments with transactional creation
- **Availability**: Barber weekly schedules

## Testing

Run tests with:
```bash
npm test
```

Test coverage includes:
- Unit tests for booking service logic
- Integration tests for REST endpoints
- GraphQL query and mutation tests
- Rate limiting validation
- Error handling scenarios

## Development

### Setup
```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Environment Variables
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
PORT=3001
NODE_ENV=development
```

## Security Features

- Input validation on all endpoints
- SQL injection prevention via Prisma ORM
- Rate limiting to prevent abuse
- Transactional booking creation
- Double booking prevention
- CORS configuration
- Error message sanitization

## Performance Considerations

- Database connection pooling via Prisma
- Efficient queries with proper indexing
- Rate limiting to prevent abuse
- Response caching for static data (services, barbers)
- Pagination for large datasets (can be added)

## Future Enhancements

- JWT authentication and authorization
- Email notifications for bookings
- SMS reminders
- Payment processing integration
- Advanced availability patterns
- Recurring bookings
- Customer reviews and ratings
- Analytics and reporting