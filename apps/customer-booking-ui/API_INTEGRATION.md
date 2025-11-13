# API Integration Guide

This document describes the API endpoints and expected responses for the Customer Booking UI.

## Base URL

```
http://localhost:3001/api
```

Configure via `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Endpoints

### Services

#### GET /services

Fetch all available barber services.

**Response:**

```json
[
  {
    "id": "svc-001",
    "name": "Classic Haircut",
    "description": "Traditional haircut with shampoo",
    "price": 25,
    "durationMinutes": 30,
    "icon": "✂️"
  },
  {
    "id": "svc-002",
    "name": "Beard Trim",
    "description": "Professional beard shaping and trim",
    "price": 20,
    "durationMinutes": 20,
    "icon": "🧔"
  }
]
```

#### GET /services/:id

Fetch a single service by ID.

**Response:**

```json
{
  "id": "svc-001",
  "name": "Classic Haircut",
  "description": "Traditional haircut with shampoo",
  "price": 25,
  "durationMinutes": 30,
  "icon": "✂️"
}
```

### Barbers

#### GET /barbers

Fetch all available barbers.

**Response:**

```json
[
  {
    "id": "barb-001",
    "name": "John Smith",
    "rating": 4.8,
    "avatar": "https://example.com/avatar1.jpg",
    "bio": "Expert barber with 10+ years experience"
  },
  {
    "id": "barb-002",
    "name": "Mike Johnson",
    "rating": 4.6,
    "avatar": "https://example.com/avatar2.jpg",
    "bio": "Specialized in modern cuts and designs"
  }
]
```

#### GET /barbers/:id

Fetch a single barber by ID.

**Response:**

```json
{
  "id": "barb-001",
  "name": "John Smith",
  "rating": 4.8,
  "avatar": "https://example.com/avatar1.jpg",
  "bio": "Expert barber with 10+ years experience"
}
```

### Time Slots

#### GET /time-slots/available

Fetch available time slots for a specific barber and date.

**Query Parameters:**

- `barberId` (required): Barber ID
- `date` (required): Date in YYYY-MM-DD format

**Example:**

```
GET /time-slots/available?barberId=barb-001&date=2024-01-15
```

**Response:**

```json
[
  {
    "id": "slot-001",
    "startTime": "09:00",
    "endTime": "09:30",
    "isAvailable": true,
    "barberId": "barb-001"
  },
  {
    "id": "slot-002",
    "startTime": "09:30",
    "endTime": "10:00",
    "isAvailable": true,
    "barberId": "barb-001"
  },
  {
    "id": "slot-003",
    "startTime": "10:00",
    "endTime": "10:30",
    "isAvailable": false,
    "barberId": "barb-001"
  }
]
```

### Bookings

#### POST /bookings

Create a new booking.

**Request Body:**

```json
{
  "serviceId": "svc-001",
  "barberId": "barb-001",
  "timeSlotId": "slot-001",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1 (555) 123-4567",
  "notes": "First time customer, please be gentle"
}
```

**Response (201 Created):**

```json
{
  "bookingId": "booking-001",
  "serviceId": "svc-001",
  "barberId": "barb-001",
  "scheduledTime": "2024-01-15T09:00:00Z",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "status": "confirmed"
}
```

#### GET /bookings/:id

Fetch booking details by ID.

**Response:**

```json
{
  "bookingId": "booking-001",
  "serviceId": "svc-001",
  "barberId": "barb-001",
  "scheduledTime": "2024-01-15T09:00:00Z",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "status": "confirmed"
}
```

#### DELETE /bookings/:id

Cancel an existing booking.

**Response (204 No Content):**

Empty response on success.

## Error Responses

### Error Response Format

All errors follow this format:

```json
{
  "message": "Descriptive error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common Error Codes

- `400`: Bad Request - Invalid request data
- `404`: Not Found - Resource not found
- `409`: Conflict - Time slot already booked
- `500`: Internal Server Error

### Example Error Response

```json
{
  "message": "Time slot is no longer available",
  "code": "SLOT_UNAVAILABLE",
  "details": {
    "slotId": "slot-001",
    "barberId": "barb-001"
  }
}
```

## Authentication

Currently, no authentication is required. In the future, consider implementing:

- JWT token-based authentication
- API key management
- User session management

## Rate Limiting

No rate limiting is currently enforced. Consider implementing:

- 100 requests per minute per IP
- 1000 requests per hour per user
- Appropriate retry-after headers

## Caching Strategy

The client uses React Query with the following cache times:

- Services: 5 minutes
- Barbers: 5 minutes
- Time Slots: 2 minutes (slots change frequently)
- Bookings: Default (1 minute)

Caches are invalidated when:

- A new booking is created (invalidates time slots)
- A booking is cancelled (invalidates time slots)

## Testing the API

### Using cURL

```bash
# Get all services
curl http://localhost:3001/api/services

# Get available slots
curl "http://localhost:3001/api/time-slots/available?barberId=barb-001&date=2024-01-15"

# Create a booking
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "svc-001",
    "barberId": "barb-001",
    "timeSlotId": "slot-001",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "+1 (555) 123-4567"
  }'
```

## Future Considerations

1. **Pagination**: Add pagination for large lists
2. **Search/Filter**: Add query parameters for filtering
3. **Webhooks**: Send webhooks for booking events
4. **Real-time Updates**: WebSocket support for real-time slot updates
5. **GraphQL**: Consider GraphQL as an alternative to REST
