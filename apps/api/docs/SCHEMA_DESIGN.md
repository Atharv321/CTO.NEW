# Barber Booking System - Schema Design Document

## Overview

This document details the Prisma ORM schema design for the barber booking management system. The schema supports customer bookings, barber availability management, service offerings, and comprehensive notification tracking.

## Technology Stack

- **ORM**: Prisma 5.7.0
- **Database**: PostgreSQL
- **Language**: TypeScript with Node.js runtime

## Core Entities

### 1. **AdminUser** (`admin_users`)

Represents system administrators and staff with different roles.

**Purpose**: 
- Manage system access and permissions
- Support different user types (admin, manager, support)
- Track authentication and last login events

**Fields**:
- `id` (String, Primary Key): Unique identifier (CUID)
- `email` (String, Unique): Admin email address
- `name` (String): Full name
- `passwordHash` (String): Bcrypt hashed password
- `role` (String): admin | manager | support (default: admin)
- `isActive` (Boolean): Soft delete indicator (default: true)
- `lastLogin` (DateTime, Optional): Last login timestamp
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes**: Unique constraint on email

---

### 2. **Customer** (`customers`)

Represents booking customers.

**Purpose**:
- Store customer information for booking management
- Track customer contact details
- Enable notifications and communication

**Fields**:
- `id` (String, Primary Key): Unique identifier (CUID)
- `email` (String, Unique): Customer email
- `phone` (String, Optional): Phone number
- `firstName` (String): First name
- `lastName` (String): Last name
- `isActive` (Boolean): Soft delete indicator (default: true)
- `createdAt` (DateTime): Registration timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships**:
- `bookings`: One-to-Many with Booking (CASCADE delete)
- `notificationLogs`: One-to-Many with NotificationLog

**Indexes**: Unique constraint on email

---

### 3. **Barber** (`barbers`)

Represents barber staff members.

**Purpose**:
- Manage barber profiles
- Associate bookings with specific barbers
- Track barber availability and overrides

**Fields**:
- `id` (String, Primary Key): Unique identifier (CUID)
- `name` (String): Barber's full name
- `email` (String, Optional, Unique): Email address
- `phone` (String, Optional): Phone number
- `isActive` (Boolean): Soft delete indicator (default: true)
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships**:
- `availabilityOverrides`: One-to-Many with AvailabilityOverride
- `bookings`: One-to-Many with Booking (RESTRICT delete to prevent data loss)
- `notificationLogs`: One-to-Many with NotificationLog

**Indexes**: Unique constraint on email

---

### 4. **Service** (`services`)

Represents barber services offered (haircut, beard trim, etc.).

**Purpose**:
- Define available services
- Store pricing and duration information
- Enable service selection during booking

**Fields**:
- `id` (String, Primary Key): Unique identifier (CUID)
- `name` (String): Service name (e.g., "Basic Haircut")
- `description` (String, Optional): Service description
- `durationMinutes` (Integer): Service duration in minutes (default: 30)
- `price` (Decimal): Service price (10,2 precision)
- `isActive` (Boolean): Soft delete indicator (default: true)
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships**:
- `bookings`: One-to-Many with Booking (RESTRICT delete)

---

### 5. **TimeSlot** (`time_slots`)

Represents pre-defined time slots for scheduling.

**Purpose**:
- Store configurable time window templates
- Support for recurring weekly schedules
- Optional future use for specific time slot management

**Fields**:
- `id` (String, Primary Key): Unique identifier (CUID)
- `dayOfWeek` (Integer): Day of week (0=Sunday, 6=Saturday)
- `startTime` (String): Start time in HH:mm format (24-hour)
- `endTime` (String): End time in HH:mm format (24-hour)
- `description` (String, Optional): Slot description
- `isActive` (Boolean): Soft delete indicator (default: true)
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Constraints**: Unique combination of (dayOfWeek, startTime, endTime)

**Note**: Currently serves as a template structure. Primary availability is managed through the `Availability` model.

---

### 6. **Availability** (`availability`)

Represents the global/default working hours for the barber shop.

**Purpose**:
- Define shop operating hours by day of week
- Set baseline availability for all barbers
- Support configurable working hours

**Fields**:
- `id` (String, Primary Key): Unique identifier (CUID)
- `dayOfWeek` (Integer): Day of week (0=Sunday, 6=Saturday)
- `startTime` (String): Start time in HH:mm format (24-hour)
- `endTime` (String): End time in HH:mm format (24-hour)
- `isWorkingDay` (Boolean): Whether the shop operates this day (default: true)
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Constraints**: Unique constraint on dayOfWeek (one record per day)

**Example Configuration**:
```
Monday-Friday: 09:00 - 18:00 (working days)
Saturday: 10:00 - 16:00 (working day)
Sunday: Closed (isWorkingDay = false)
```

**Design Decision**: 
- Seven records (one per day) allow flexible per-day configuration
- The `isWorkingDay` flag cleanly handles closed days without complex time ranges
- This design supports future features like extended hours on specific days

---

### 7. **AvailabilityOverride** (`availability_overrides`)

Represents exceptions to global availability (per-barber schedules, holidays, special hours).

**Purpose**:
- Override default shop availability for specific dates
- Support per-barber custom availability
- Handle holidays, special events, day-offs
- Enable dynamic schedule adjustments

**Fields**:
- `id` (String, Primary Key): Unique identifier (CUID)
- `barberId` (String, Optional, Foreign Key): Reference to Barber (SET NULL on delete)
- `date` (DateTime): Specific date for the override
- `startTime` (String): Override start time in HH:mm format
- `endTime` (String): Override end time in HH:mm format
- `isAvailable` (Boolean): true = available during override, false = unavailable (default: true)
- `reason` (String, Optional): Reason for override (e.g., "Holiday", "Day off")
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships**:
- `barber`: Many-to-One with Barber (optional, allows system-wide overrides)

**Usage Examples**:

1. **Per-Barber Custom Hours**:
   ```
   barberId: "john-123"
   date: 2024-01-15
   startTime: "10:00"
   endTime: "14:00"
   isAvailable: true
   reason: "Part-time shift"
   ```

2. **Shop-Wide Holiday**:
   ```
   barberId: null
   date: 2024-12-25
   startTime: "00:00"
   endTime: "00:00"
   isAvailable: false
   reason: "Christmas Holiday"
   ```

3. **Barber Day Off**:
   ```
   barberId: "john-123"
   date: 2024-01-22
   startTime: "00:00"
   endTime: "00:00"
   isAvailable: false
   reason: "Day off"
   ```

**Design Decision**:
- Optional `barberId` allows both individual and system-wide overrides
- Separate date field enables precise date-based exceptions
- `isAvailable` flag provides semantic clarity over time ranges
- Flexible reason field supports audit trails and user communication

---

### 8. **Booking** (`bookings`)

Represents actual barber shop bookings/appointments.

**Purpose**:
- Store booking information
- Track booking status and history
- Link customers, barbers, and services
- Enable booking management operations

**Fields**:
- `id` (String, Primary Key): Unique identifier (CUID)
- `customerId` (String, Foreign Key): Reference to Customer (CASCADE delete)
- `barberId` (String, Foreign Key): Reference to Barber (RESTRICT delete)
- `serviceId` (String, Foreign Key): Reference to Service (RESTRICT delete)
- `scheduledAt` (DateTime): Booking appointment date/time
- `durationMinutes` (Integer): Service duration in minutes
- `status` (String): Booking status (default: "pending")
- `notes` (String, Optional): Additional booking notes
- `cancellationReason` (String, Optional): Reason if cancelled
- `cancelledAt` (DateTime, Optional): Cancellation timestamp
- `createdAt` (DateTime): Booking creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships**:
- `customer`: Many-to-One with Customer
- `barber`: Many-to-One with Barber
- `service`: Many-to-One with Service

**Indexes**:
- Index on `customerId` (frequent lookups)
- Index on `barberId` (barber schedule queries)
- Index on `serviceId` (service analytics)
- Index on `scheduledAt` (time-based queries)
- Index on `status` (status-based filtering)

**Booking Status Flow**:
```
pending -> confirmed -> completed
       ↓
     cancelled
       ↓
     no-show
```

**Design Decision**:
- CASCADE delete on Customer (bookings become orphaned if customer deleted)
- RESTRICT delete on Barber/Service (prevents accidental data loss)
- Separate `cancelledAt` timestamp enables audit trails
- Duration stored on booking for historical accuracy (service duration may change)

---

### 9. **NotificationLog** (`notification_logs`)

Represents all notifications sent to customers and barbers.

**Purpose**:
- Track all outgoing notifications
- Support audit trails and compliance
- Enable notification retry/failure analysis
- Support multi-channel notifications

**Fields**:
- `id` (String, Primary Key): Unique identifier (CUID)
- `customerId` (String, Optional, Foreign Key): Reference to Customer
- `barberId` (String, Optional, Foreign Key): Reference to Barber
- `bookingId` (String, Optional): Associated booking ID (stored as string for flexibility)
- `type` (String): Notification type (email | sms | push | in-app)
- `subject` (String, Optional): Email subject or notification title
- `message` (String): Notification message/content
- `status` (String): Delivery status (default: "pending")
- `sentAt` (DateTime, Optional): Actual send timestamp
- `failureReason` (String, Optional): Reason for failure
- `createdAt` (DateTime): Log creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships**:
- `customer`: Many-to-One with Customer (optional)
- `barber`: Many-to-One with Barber (optional)

**Indexes**:
- Index on `customerId` (customer notification history)
- Index on `barberId` (barber notification history)
- Index on `type` (notification type filtering)
- Index on `status` (retry/failed notification queries)

**Notification Status Flow**:
```
pending -> sent
        ↓
      failed -> bounced
```

**Design Decision**:
- Both customerId and barberId optional (supports system notifications)
- bookingId stored as string for flexibility (may not always have booking context)
- Separate `sentAt` timestamp enables analytics on delivery delays
- `failureReason` supports debugging and retry logic
- Type enumeration (email, sms, push, in-app) supports multi-channel strategy

---

## Data Relationships

### Booking-Centric Relationships

```
Customer (1) ──→ (n) Booking
Barber (1) ──→ (n) Booking
Service (1) ──→ (n) Booking

Barber (1) ──→ (n) AvailabilityOverride
```

### Notification Relationships

```
Customer (1) ──→ (n) NotificationLog
Barber (1) ──→ (n) NotificationLog
```

### Availability Relationships

```
Availability: Global shop schedule (7 records, one per day)
AvailabilityOverride: Exceptions and per-barber customization
```

---

## Design Principles

### 1. **Soft Deletes**
- `isActive` boolean flags enable soft deletes
- Allows audit trails and data recovery
- Important for historical data preservation

### 2. **Cascading vs. Restricting Deletes**
- **CASCADE**: Customer deletes (bookings are customer-specific)
- **RESTRICT**: Service/Barber deletes (prevents accidental loss of historical data)

### 3. **Composite Keys**
- Unique constraints on combinations (e.g., dayOfWeek in Availability)
- Prevents duplicate configurations

### 4. **Temporal Data**
- `createdAt` and `updatedAt` on all models for audit trails
- Separate `cancelledAt` and `sentAt` for specific events

### 5. **Flexible Availability Model**
- Global `Availability` (7 records per day)
- `AvailabilityOverride` for exceptions and per-barber customization
- Supports complex scheduling scenarios

### 6. **Optional Foreign Keys**
- NotificationLog can exist without customer/barber
- AvailabilityOverride can be shop-wide (no barberId)
- Supports flexibility and future use cases

---

## Availability Configuration Strategy

### Global Configuration (Default)
Define in `Availability` table (one record per day of week):
- Monday-Friday: 09:00 - 18:00 (working)
- Saturday: 10:00 - 16:00 (working)
- Sunday: Not working (isWorkingDay=false)

### Per-Barber Overrides
Add records to `AvailabilityOverride`:
- Barber-specific hours on specific dates
- Part-time shifts
- Time off/holidays
- Special hours for special events

### Application Logic (Recommended)
```typescript
// Get available time slots for barber on specific date
async function getAvailableSlots(barberId, date) {
  // 1. Get global availability for this date's day of week
  const globalAvailability = await Availability.findOne({ dayOfWeek });
  
  // 2. Check for per-barber overrides for this date
  const overrides = await AvailabilityOverride.find({ barberId, date });
  
  // 3. Merge: overrides take precedence over global availability
  // 4. Calculate remaining slots accounting for existing bookings
  // 5. Return available time slots
}
```

---

## Migration Strategy

### Initial Setup
1. Run `prisma migrate dev` to create initial schema
2. Execute `npm run seed` to populate barbers, services, and default availability
3. Verify schema with `prisma studio`

### Future Migrations
- Use `prisma migrate dev --name <migration_name>` for schema changes
- All migrations are version-controlled in `prisma/migrations/`
- Production deployments use `prisma migrate deploy`

---

## Performance Considerations

### Indexes
- Booking indexes on frequently queried fields (customerId, barberId, serviceId, scheduledAt, status)
- NotificationLog indexes for audit and retry operations
- Enable efficient queries for:
  - Customer booking history
  - Barber schedule
  - Service availability
  - Notification tracking

### Pagination
Recommended for high-volume queries:
```typescript
const bookings = await prisma.booking.findMany({
  where: { barberId },
  take: 20,
  skip: pageNumber * 20,
  orderBy: { scheduledAt: 'asc' }
});
```

### Connection Pooling
- Prisma client handles connection pooling automatically
- Production deployments should configure PostgreSQL connection limits

---

## Security Considerations

1. **Password Hashing**: AdminUser passwords hashed with bcrypt
2. **Data Validation**: Input validation on all API endpoints
3. **Access Control**: Role-based access (admin, manager, support)
4. **Audit Trails**: Timestamps and NotificationLog for compliance
5. **Cascading Deletes**: Restricted to prevent data loss

---

## Future Enhancements

1. **Barber Skills/Certifications**: Track which barbers can perform which services
2. **Customer Preferences**: Favorite barbers, preferred times
3. **Review System**: Customer ratings and reviews
4. **Payment Tracking**: Transaction records and payment methods
5. **Multi-Location Support**: Location-aware availability and barbers
6. **Waiting List**: Booking cancellation wait-list functionality
7. **Analytics Tables**: Denormalized tables for reporting

---

## Schema Version History

| Date | Version | Changes |
|------|---------|---------|
| 2024-01-15 | 1.0.0 | Initial schema design with all core entities |

---

## Appendix: Database Connection

### Environment Configuration
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/barber_booking_db
```

### Prisma Client Usage
```typescript
import prisma from './database/prisma';

// Query examples
const bookings = await prisma.booking.findMany({ where: { status: 'confirmed' } });
const customer = await prisma.customer.create({ data: { email, firstName, lastName } });
```

### Common Operations

**Create Booking**:
```typescript
await prisma.booking.create({
  data: {
    customerId,
    barberId,
    serviceId,
    scheduledAt,
    durationMinutes,
    status: 'pending'
  }
});
```

**Get Barber's Schedule**:
```typescript
await prisma.booking.findMany({
  where: {
    barberId,
    scheduledAt: { gte: startDate, lte: endDate }
  },
  orderBy: { scheduledAt: 'asc' }
});
```

**Log Notification**:
```typescript
await prisma.notificationLog.create({
  data: {
    customerId,
    type: 'email',
    subject: 'Booking Confirmation',
    message: 'Your booking is confirmed',
    status: 'pending'
  }
});
```
