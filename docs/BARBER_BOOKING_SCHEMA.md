# Barber Booking System - Data Models Implementation

## Executive Summary

This document describes the complete data model implementation for the barber booking system using Prisma ORM with PostgreSQL. The system supports:

- **Customer Management**: Registration, contact tracking
- **Barber Management**: Staff profiles and availability
- **Service Catalog**: Available barber services with pricing
- **Booking System**: Appointment management with status tracking
- **Availability Management**: Global shop hours + per-barber customization
- **Notification Tracking**: Multi-channel notification audit logs
- **Admin System**: Role-based access control

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| ORM | Prisma | 5.7.0 |
| Database | PostgreSQL | 12+ |
| Language | TypeScript | 5.0+ |
| Node.js | Runtime | 18+ |

## Database Schema

### Entity Relationship Diagram

```
AdminUser (1) ──→ (n) [System Admins]

Customer (1) ──→ (n) Booking
         ↓
         └──→ (n) NotificationLog

Barber (1) ──→ (n) Booking
      ├──→ (n) AvailabilityOverride
      └──→ (n) NotificationLog

Service (1) ──→ (n) Booking

Availability (Global shop hours, 7 records)
AvailabilityOverride (Per-barber exceptions & holidays)
```

### Table Definitions

#### 1. `admin_users` - System Administrators

| Field | Type | Constraints |
|-------|------|-----------|
| id | TEXT | PK, CUID |
| email | TEXT | UNIQUE, NOT NULL |
| name | TEXT | NOT NULL |
| passwordHash | TEXT | NOT NULL |
| role | TEXT | NOT NULL, DEFAULT: 'admin' |
| isActive | BOOLEAN | DEFAULT: true |
| lastLogin | TIMESTAMP | Optional |
| createdAt | TIMESTAMP | DEFAULT: NOW() |
| updatedAt | TIMESTAMP | Auto-updated |

**Roles**: admin, manager, support
**Purpose**: System access and administration

---

#### 2. `customers` - Booking Customers

| Field | Type | Constraints |
|-------|------|-----------|
| id | TEXT | PK, CUID |
| email | TEXT | UNIQUE, NOT NULL |
| phone | TEXT | Optional |
| firstName | TEXT | NOT NULL |
| lastName | TEXT | NOT NULL |
| isActive | BOOLEAN | DEFAULT: true |
| createdAt | TIMESTAMP | DEFAULT: NOW() |
| updatedAt | TIMESTAMP | Auto-updated |

**Purpose**: Store customer information for bookings
**Relationships**: bookings (1:n), notificationLogs (1:n)

---

#### 3. `barbers` - Barber Staff

| Field | Type | Constraints |
|-------|------|-----------|
| id | TEXT | PK, CUID |
| name | TEXT | NOT NULL |
| email | TEXT | UNIQUE, Optional |
| phone | TEXT | Optional |
| isActive | BOOLEAN | DEFAULT: true |
| createdAt | TIMESTAMP | DEFAULT: NOW() |
| updatedAt | TIMESTAMP | Auto-updated |

**Purpose**: Staff management
**Relationships**: bookings (1:n), availabilityOverrides (1:n), notificationLogs (1:n)

---

#### 4. `services` - Barber Services

| Field | Type | Constraints |
|-------|------|-----------|
| id | TEXT | PK, CUID |
| name | TEXT | NOT NULL |
| description | TEXT | Optional |
| durationMinutes | INTEGER | DEFAULT: 30 |
| price | DECIMAL(10,2) | NOT NULL |
| isActive | BOOLEAN | DEFAULT: true |
| createdAt | TIMESTAMP | DEFAULT: NOW() |
| updatedAt | TIMESTAMP | Auto-updated |

**Purpose**: Define available services (haircut, beard trim, etc.)
**Sample Data**: 8 services with prices ranging from $15-$50
**Relationships**: bookings (1:n)

---

#### 5. `time_slots` - Time Slot Templates

| Field | Type | Constraints |
|-------|------|-----------|
| id | TEXT | PK, CUID |
| dayOfWeek | INTEGER | 0-6 (Sunday-Saturday) |
| startTime | TEXT | HH:mm format |
| endTime | TEXT | HH:mm format |
| description | TEXT | Optional |
| isActive | BOOLEAN | DEFAULT: true |
| createdAt | TIMESTAMP | DEFAULT: NOW() |
| updatedAt | TIMESTAMP | Auto-updated |

**Constraint**: UNIQUE(dayOfWeek, startTime, endTime)
**Purpose**: Template for recurring time windows (optional, for future use)

---

#### 6. `availability` - Global Shop Hours

| Field | Type | Constraints |
|-------|------|-----------|
| id | TEXT | PK, CUID |
| dayOfWeek | INTEGER | 0-6 (Sunday-Saturday) |
| startTime | TEXT | HH:mm format (24-hour) |
| endTime | TEXT | HH:mm format (24-hour) |
| isWorkingDay | BOOLEAN | DEFAULT: true |
| createdAt | TIMESTAMP | DEFAULT: NOW() |
| updatedAt | TIMESTAMP | Auto-updated |

**Constraint**: UNIQUE(dayOfWeek) - one record per day
**Purpose**: Define default shop operating hours
**Default Schedule**:
- Monday-Friday: 09:00 - 18:00 (working)
- Saturday: 10:00 - 16:00 (working)
- Sunday: Not working (isWorkingDay=false)

---

#### 7. `availability_overrides` - Exceptions & Per-Barber Hours

| Field | Type | Constraints |
|-------|------|-----------|
| id | TEXT | PK, CUID |
| barberId | TEXT | FK to barbers, Optional, SET NULL on delete |
| date | TIMESTAMP | Date of the override |
| startTime | TEXT | HH:mm format (24-hour) |
| endTime | TEXT | HH:mm format (24-hour) |
| isAvailable | BOOLEAN | DEFAULT: true |
| reason | TEXT | Optional (e.g., "Holiday", "Day off") |
| createdAt | TIMESTAMP | DEFAULT: NOW() |
| updatedAt | TIMESTAMP | Auto-updated |

**Purpose**: 
- Shop-wide exceptions (holidays, special hours)
- Per-barber custom availability (part-time shifts, day off)

**Design**:
- `barberId = null` means system-wide override
- `barberId != null` means barber-specific override
- `isAvailable = false` means unavailable (closes this override)
- Time ranges (00:00 to 00:00) indicate full-day unavailability

**Example Overrides**:
```
Christmas Holiday (shop-wide):
- barberId: null
- date: 2024-12-25
- isAvailable: false
- reason: "Christmas Holiday"

Part-time Shift:
- barberId: "john-123"
- date: 2024-01-15
- startTime: "10:00", endTime: "14:00"
- isAvailable: true
- reason: "Part-time shift"

Barber Day Off:
- barberId: "john-123"
- date: 2024-01-22
- isAvailable: false
- reason: "Day off"
```

---

#### 8. `bookings` - Appointments

| Field | Type | Constraints |
|-------|------|-----------|
| id | TEXT | PK, CUID |
| customerId | TEXT | FK to customers, CASCADE on delete |
| barberId | TEXT | FK to barbers, RESTRICT on delete |
| serviceId | TEXT | FK to services, RESTRICT on delete |
| scheduledAt | TIMESTAMP | Appointment date/time |
| durationMinutes | INTEGER | Service duration |
| status | TEXT | DEFAULT: 'pending' |
| notes | TEXT | Optional |
| cancellationReason | TEXT | Optional |
| cancelledAt | TIMESTAMP | Optional |
| createdAt | TIMESTAMP | DEFAULT: NOW() |
| updatedAt | TIMESTAMP | Auto-updated |

**Indexes**:
- customerId (customer booking history)
- barberId (barber schedule)
- serviceId (service analytics)
- scheduledAt (date-based queries)
- status (status-based filtering)

**Status Flow**:
```
pending → confirmed → completed
        ↓
      cancelled (with reason & timestamp)
        ↓
      no-show
```

**Relationships**: 
- Many-to-One: Customer (CASCADE)
- Many-to-One: Barber (RESTRICT)
- Many-to-One: Service (RESTRICT)

**Design Decision**:
- Duration stored on booking for historical accuracy
- Separate cancellationReason and cancelledAt for audit trail

---

#### 9. `notification_logs` - Notification Audit Trail

| Field | Type | Constraints |
|-------|------|-----------|
| id | TEXT | PK, CUID |
| customerId | TEXT | FK to customers, Optional, SET NULL on delete |
| barberId | TEXT | FK to barbers, Optional, SET NULL on delete |
| bookingId | TEXT | Optional (no FK for flexibility) |
| type | TEXT | NOT NULL (email, sms, push, in-app) |
| subject | TEXT | Optional (email subject) |
| message | TEXT | NOT NULL |
| status | TEXT | DEFAULT: 'pending' |
| sentAt | TIMESTAMP | Optional |
| failureReason | TEXT | Optional |
| createdAt | TIMESTAMP | DEFAULT: NOW() |
| updatedAt | TIMESTAMP | Auto-updated |

**Indexes**:
- customerId (customer notification history)
- barberId (barber notifications)
- type (notification type filtering)
- status (retry/failed queries)

**Status Flow**:
```
pending → sent
        ↓
      failed → bounced
```

**Notification Types**: email, sms, push, in-app

**Design Decision**:
- Both customerId and barberId optional (system notifications)
- bookingId stored as string for flexibility
- Separate sentAt timestamp for delivery analytics

---

## Key Design Decisions

### 1. Availability Strategy

**Two-Layer Model**:
- **Layer 1 - Availability**: Global 7-record shop schedule (one per day of week)
- **Layer 2 - AvailabilityOverride**: Exceptions and per-barber customization

**Benefits**:
- Simple default configuration (7 records)
- Flexible for complex scenarios (holidays, part-time, per-barber)
- Easy to query and apply business logic

### 2. Cascading vs. Restricting Deletes

| Model | Delete Policy | Reason |
|-------|---|---------|
| Customer | CASCADE | Bookings are customer-specific; can be removed with customer |
| Barber | RESTRICT | Prevents accidental deletion of staff with historical bookings |
| Service | RESTRICT | Prevents accidental deletion of service with historical bookings |

### 3. Soft Deletes via isActive

- `isActive` boolean on all user-facing entities
- Enables audit trails and data recovery
- Supports temporary deactivation without deletion

### 4. Optional Foreign Keys

- NotificationLog: customerId, barberId optional (supports system notifications)
- AvailabilityOverride: barberId optional (allows system-wide overrides)

### 5. Time Format

- 24-hour HH:mm format (e.g., "09:00", "18:00")
- Easy to parse and compare
- Avoids timezone-related issues with TIMESTAMP type

## Sample Data

### Admin Users (3)
- admin@barberapp.com (admin)
- manager@barberapp.com (manager)
- support@barberapp.com (support)

### Services (8)
1. Basic Haircut (30 min, $25)
2. Premium Haircut (45 min, $40)
3. Beard Trim (20 min, $15)
4. Beard Shave (25 min, $20)
5. Haircut + Beard Trim (50 min, $40)
6. Kids Haircut (25 min, $18)
7. Hair Coloring (60 min, $50)
8. Fade Cut (35 min, $30)

### Barbers (5)
1. John Smith
2. Michael Johnson
3. Robert Williams
4. James Brown
5. David Martinez

### Customers (5) + Bookings (10)
- 5 sample customers with emails and phone numbers
- 10 confirmed bookings spread across next 14 days

### Global Availability
- Monday-Friday: 09:00 - 18:00
- Saturday: 10:00 - 16:00
- Sunday: Closed

## Queries & Operations

### Get Barber's Schedule
```typescript
const schedule = await prisma.booking.findMany({
  where: {
    barberId: 'barber-id',
    scheduledAt: { gte: startDate, lte: endDate }
  },
  include: { customer: true, service: true },
  orderBy: { scheduledAt: 'asc' }
});
```

### Check Availability
```typescript
const availability = await prisma.availability.findUnique({
  where: { dayOfWeek: 1 } // Monday
});
```

### Get Available Slots
```typescript
// 1. Get global availability
const globalAvail = await prisma.availability.findUnique({ 
  where: { dayOfWeek } 
});

// 2. Check overrides for specific date
const overrides = await prisma.availabilityOverride.findMany({
  where: { date: { gte: startDate, lt: endDate } }
});

// 3. Get bookings for date
const bookings = await prisma.booking.findMany({
  where: { 
    barberId, 
    scheduledAt: { gte: startDate, lt: endDate } 
  }
});

// 4. Calculate available 30-minute slots (business logic)
```

### Create Booking
```typescript
const booking = await prisma.booking.create({
  data: {
    customerId, barberId, serviceId,
    scheduledAt, durationMinutes, status: 'confirmed'
  },
  include: { customer: true, barber: true, service: true }
});
```

### Cancel Booking
```typescript
await prisma.booking.update({
  where: { id },
  data: {
    status: 'cancelled',
    cancellationReason: 'Customer request',
    cancelledAt: new Date()
  }
});
```

### Log Notification
```typescript
await prisma.notificationLog.create({
  data: {
    customerId, type: 'email',
    subject: 'Booking Confirmation',
    message: 'Your booking confirmed for...',
    status: 'pending'
  }
});
```

## Performance Considerations

### Indexes
All high-frequency query fields are indexed:
- Booking: customerId, barberId, serviceId, scheduledAt, status
- NotificationLog: customerId, barberId, type, status

### Connection Pooling
- Prisma handles connection pooling automatically
- PostgreSQL should have sufficient max_connections (default 100)

### Pagination
```typescript
const bookings = await prisma.booking.findMany({
  take: 20, skip: pageNumber * 20,
  orderBy: { scheduledAt: 'asc' }
});
```

## Migration Guide

### Initial Setup
```bash
cd apps/api
pnpm install
pnpm run migrate:dev       # Create schema
pnpm run seed              # Load sample data
```

### Future Changes
```bash
# Edit prisma/schema.prisma
pnpm run migrate:dev --name add_new_feature

# Deploy to production
pnpm run migrate
```

## Security & Compliance

1. **Password Hashing**: AdminUser passwords use bcrypt (rounds: 10)
2. **Access Control**: Role-based roles (admin, manager, support)
3. **Audit Trail**: Timestamps + NotificationLog for compliance
4. **Data Protection**: Soft deletes preserve historical data
5. **Validation**: Input validation on all API endpoints

## Future Enhancements

1. **Multi-location Support**: location_id in availability and bookings
2. **Barber Skills**: junction table for barbers ↔ services many-to-many
3. **Customer Preferences**: favorite_barber_id, preferred_times
4. **Payment System**: payments table for booking transactions
5. **Reviews & Ratings**: customer ratings on barbers/services
6. **Waiting Lists**: cancellation wait-list management
7. **Analytics**: Denormalized analytics tables for reporting

## Documentation

- **SCHEMA_DESIGN.md** (apps/api/docs/): Detailed schema documentation
- **PRISMA_SETUP.md** (apps/api/docs/): Setup and usage guide
- **prisma/schema.prisma**: Complete schema definition
- **prisma/migrations/**: All migration files (version controlled)

## Support & Debugging

### Common Issues

**Database won't connect**:
```bash
# Verify PostgreSQL is running
docker-compose up -d postgres
# Check connection string in .env
```

**Prisma Client not found**:
```bash
pnpm run prisma:generate
```

**Migration conflicts**:
```bash
# Careful! This resets all data
pnpm run migrate:reset --force
pnpm run seed
```

### Useful Commands

```bash
pnpm run migrate:dev              # Interactive migration
pnpm run migrate                  # Deploy migrations
pnpm run seed                     # Seed sample data
pnpm run prisma:studio           # GUI database browser
pnpm run prisma:generate         # Regenerate client
```

## Conclusion

The barber booking system schema provides a robust, scalable foundation for managing customers, barbers, services, and bookings with sophisticated availability management. The two-layer availability model (global + overrides) supports both simple configurations and complex business requirements.

All relationships, constraints, and indexes are optimized for typical booking system queries. The system is ready for production deployment with proper database configuration and security measures.
