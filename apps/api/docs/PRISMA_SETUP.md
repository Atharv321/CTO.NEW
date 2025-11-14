# Prisma ORM Setup Guide

## Overview

This guide explains how to set up, use, and maintain Prisma ORM for the barber booking system.

## Quick Start

### 1. Installation

Dependencies are already added to `package.json`. Install them:

```bash
cd apps/api
pnpm install
```

### 2. Environment Configuration

Update or create `.env` file in `apps/api/`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/barber_booking_db
```

For Docker Compose environment:
```bash
# Using docker-compose
docker-compose up -d postgres
```

### 3. Run Migrations

Create and apply database schema:

```bash
pnpm run migrate:dev
```

This will:
1. Create the PostgreSQL database if it doesn't exist
2. Apply all migrations from `prisma/migrations/`
3. Generate Prisma Client

### 4. Seed Database

Populate the database with sample data:

```bash
pnpm run seed
```

This creates:
- 3 Admin users (admin, manager, support)
- 5 Sample barbers
- 8 Services (haircut, beard trim, etc.)
- Global availability schedule (Mon-Fri 9-6, Sat 10-4, Sun closed)
- 5 Sample customers
- 10 Sample bookings

### 5. Verify Schema

View the database schema in interactive UI:

```bash
pnpm run prisma:studio
```

Opens http://localhost:5555 where you can browse and edit data.

## Available Commands

### Development

```bash
# Run migrations in development mode (interactive)
pnpm run migrate:dev

# Watch for schema changes and auto-migrate
pnpm run migrate:dev -- --name add_new_feature
```

### Production

```bash
# Deploy migrations (non-interactive, for CI/CD)
pnpm run migrate

# Reset database (⚠️ WARNING: deletes all data!)
pnpm run migrate:reset --force
```

### Utilities

```bash
# Seed database with sample data
pnpm run seed

# Generate Prisma Client (done automatically after migrate)
pnpm run prisma:generate

# Open Prisma Studio (database browser UI)
pnpm run prisma:studio
```

## File Structure

```
apps/api/
├── prisma/
│   ├── schema.prisma              # Main schema definition
│   ├── migrations/
│   │   └── 001_init/
│   │       └── migration.sql      # Initial schema migration
│   └── .gitkeep                   # Placeholder for git
├── src/
│   ├── database/
│   │   ├── prisma.ts              # Prisma client instance
│   │   ├── seed-barber-booking.ts # Barber system seed script
│   │   ├── migrations.ts          # Legacy migrations (deprecated)
│   │   ├── seed.ts                # Legacy seed (deprecated)
│   │   └── connection.ts          # Legacy connection (deprecated)
│   └── ...
├── .env.example                   # Example environment variables
└── package.json                   # Scripts and dependencies
```

## Schema Overview

### Core Tables

| Table | Purpose | Records |
|-------|---------|---------|
| `admin_users` | System administrators | 3 (sample) |
| `customers` | Booking customers | 5 (sample) |
| `barbers` | Barber staff members | 5 (sample) |
| `services` | Available services | 8 (sample) |
| `bookings` | Actual appointments | 10 (sample) |
| `availability` | Global working hours | 7 (one per day) |
| `availability_overrides` | Per-barber exceptions | 0 (sample) |
| `time_slots` | Time slot templates | 0 (sample) |
| `notification_logs` | Sent notifications | 0 (sample) |

See `SCHEMA_DESIGN.md` for detailed documentation.

## Usage Examples

### Import Prisma Client

```typescript
import prisma from './database/prisma.js';
```

### Create Records

```typescript
// Create a customer
const customer = await prisma.customer.create({
  data: {
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '555-0123',
  },
});

// Create a booking
const booking = await prisma.booking.create({
  data: {
    customerId: 'customer-id',
    barberId: 'barber-id',
    serviceId: 'service-id',
    scheduledAt: new Date('2024-01-15T10:00:00'),
    durationMinutes: 30,
    status: 'confirmed',
  },
});
```

### Query Records

```typescript
// Find all confirmed bookings
const bookings = await prisma.booking.findMany({
  where: { status: 'confirmed' },
  orderBy: { scheduledAt: 'asc' },
});

// Get barber's schedule
const barberSchedule = await prisma.booking.findMany({
  where: {
    barberId: 'barber-id',
    scheduledAt: {
      gte: new Date('2024-01-01'),
      lte: new Date('2024-01-31'),
    },
  },
  include: {
    customer: true,
    service: true,
  },
  orderBy: { scheduledAt: 'asc' },
});

// Find customer with bookings
const customer = await prisma.customer.findUnique({
  where: { email: 'john@example.com' },
  include: { bookings: true },
});
```

### Update Records

```typescript
// Confirm a booking
const updated = await prisma.booking.update({
  where: { id: 'booking-id' },
  data: { status: 'confirmed' },
});

// Cancel a booking
await prisma.booking.update({
  where: { id: 'booking-id' },
  data: {
    status: 'cancelled',
    cancellationReason: 'Customer requested',
    cancelledAt: new Date(),
  },
});
```

### Delete Records

```typescript
// Delete a booking
await prisma.booking.delete({
  where: { id: 'booking-id' },
});

// Delete customer (cascades to bookings)
await prisma.customer.delete({
  where: { id: 'customer-id' },
});
```

### Transactions

```typescript
// Use transaction for multiple operations
const result = await prisma.$transaction(async (tx) => {
  const customer = await tx.customer.create({
    data: { email, firstName, lastName },
  });

  const booking = await tx.booking.create({
    data: {
      customerId: customer.id,
      barberId,
      serviceId,
      scheduledAt,
      durationMinutes: 30,
    },
  });

  return { customer, booking };
});
```

## Working with Availability

### Get Global Availability

```typescript
const availability = await prisma.availability.findMany({
  orderBy: { dayOfWeek: 'asc' },
});
```

### Check if Shop is Open

```typescript
const now = new Date();
const dayOfWeek = now.getDay();

const dayAvailability = await prisma.availability.findUnique({
  where: { dayOfWeek },
});

const isOpen = dayAvailability?.isWorkingDay ?? false;
```

### Get Available Time Slots for Barber

```typescript
async function getAvailableSlots(barberId: string, date: Date) {
  // 1. Get global availability
  const dayOfWeek = date.getDay();
  const globalAvail = await prisma.availability.findUnique({
    where: { dayOfWeek },
  });

  if (!globalAvail?.isWorkingDay) {
    return []; // Shop closed
  }

  // 2. Check for per-barber overrides
  const overrides = await prisma.availabilityOverride.findMany({
    where: {
      barberId,
      date: {
        gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
      },
    },
  });

  // 3. Apply overrides (they take precedence)
  let startTime = globalAvail.startTime;
  let endTime = globalAvail.endTime;
  let isAvailable = true;

  if (overrides.length > 0) {
    const override = overrides[0];
    startTime = override.startTime;
    endTime = override.endTime;
    isAvailable = override.isAvailable;
  }

  if (!isAvailable) {
    return []; // Barber unavailable
  }

  // 4. Get existing bookings
  const bookings = await prisma.booking.findMany({
    where: {
      barberId,
      scheduledAt: {
        gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
      },
    },
    select: { scheduledAt: true, durationMinutes: true },
  });

  // 5. Calculate available slots (30-minute intervals)
  const slots = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let current = new Date(date);
  current.setHours(startHour, startMin, 0, 0);
  const slotEnd = new Date(date);
  slotEnd.setHours(endHour, endMin, 0, 0);

  while (current < slotEnd) {
    const slotStart = new Date(current);
    const slotFinish = new Date(current);
    slotFinish.setMinutes(slotFinish.getMinutes() + 30);

    // Check if slot conflicts with bookings
    const isBooked = bookings.some(
      (booking) =>
        booking.scheduledAt < slotFinish &&
        new Date(booking.scheduledAt.getTime() + booking.durationMinutes * 60000) > slotStart
    );

    if (!isBooked) {
      slots.push(slotStart);
    }

    current = slotFinish;
  }

  return slots;
}
```

### Create Availability Override

```typescript
// Per-barber custom hours
await prisma.availabilityOverride.create({
  data: {
    barberId: 'barber-id',
    date: new Date('2024-01-15'),
    startTime: '10:00',
    endTime: '14:00',
    isAvailable: true,
    reason: 'Part-time shift',
  },
});

// Shop-wide holiday
await prisma.availabilityOverride.create({
  data: {
    date: new Date('2024-12-25'),
    startTime: '00:00',
    endTime: '00:00',
    isAvailable: false,
    reason: 'Christmas Holiday',
  },
});
```

## Working with Notifications

### Log a Notification

```typescript
await prisma.notificationLog.create({
  data: {
    customerId: 'customer-id',
    type: 'email',
    subject: 'Booking Confirmation',
    message: 'Your booking is confirmed for January 15 at 10:00 AM',
    status: 'pending',
  },
});
```

### Query Notifications

```typescript
// Get pending notifications to send
const pending = await prisma.notificationLog.findMany({
  where: { status: 'pending' },
  orderBy: { createdAt: 'asc' },
  take: 100,
});

// Get customer notification history
const history = await prisma.notificationLog.findMany({
  where: { customerId: 'customer-id' },
  orderBy: { createdAt: 'desc' },
});

// Get failed notifications
const failed = await prisma.notificationLog.findMany({
  where: { status: 'failed' },
});
```

### Update Notification Status

```typescript
// Mark as sent
await prisma.notificationLog.update({
  where: { id: 'notification-id' },
  data: {
    status: 'sent',
    sentAt: new Date(),
  },
});

// Mark as failed
await prisma.notificationLog.update({
  where: { id: 'notification-id' },
  data: {
    status: 'failed',
    failureReason: 'Email address invalid',
  },
});
```

## Database Migrations

### Creating a New Migration

1. Update `prisma/schema.prisma` with your changes
2. Run:
   ```bash
   pnpm run migrate:dev --name describe_your_change
   ```
3. This creates a new migration file in `prisma/migrations/`
4. Review the SQL in the migration file
5. Test the migration locally

### Example: Adding a Field

**Step 1**: Update schema.prisma
```prisma
model Service {
  // ... existing fields
  category String? // New field
}
```

**Step 2**: Create migration
```bash
pnpm run migrate:dev --name add_service_category
```

**Step 3**: Verify migration
```bash
# Check the generated SQL
cat prisma/migrations/002_add_service_category/migration.sql
```

**Step 4**: Deploy
```bash
pnpm run migrate  # Production deployment
```

## Troubleshooting

### Connection Issues

```bash
# Test database connection
DATABASE_URL="postgresql://user:pass@localhost:5432/db" \
  npx prisma db execute --stdin < /dev/null
```

### Migration Conflicts

```bash
# Reset database (⚠️ WARNING: destructive!)
pnpm run migrate:reset --force

# Then reseed
pnpm run seed
```

### Prisma Client Not Found

```bash
# Regenerate Prisma Client
pnpm run prisma:generate
```

### Port Already in Use

If port 5555 (Prisma Studio) is in use:
```bash
# Kill the process or use a different port
PORT=5556 pnpm run prisma:studio
```

## Best Practices

1. **Always use transactions for multi-step operations**
   ```typescript
   await prisma.$transaction(async (tx) => {
     // Multiple operations that must succeed together
   });
   ```

2. **Include relationships when needed**
   ```typescript
   const booking = await prisma.booking.findUnique({
     where: { id },
     include: { customer: true, barber: true, service: true },
   });
   ```

3. **Use select to limit fields**
   ```typescript
   const bookings = await prisma.booking.findMany({
     select: {
       id: true,
       scheduledAt: true,
       customer: { select: { name: true } },
     },
   });
   ```

4. **Handle unique constraint errors**
   ```typescript
   try {
     await prisma.customer.create({ data });
   } catch (e) {
     if (e.code === 'P2002') {
       // Unique constraint violation
     }
   }
   ```

5. **Use proper indexing for performance**
   - Booking queries by status, barber, date are indexed
   - Check `SCHEMA_DESIGN.md` for all indexes

## Related Documentation

- `SCHEMA_DESIGN.md` - Detailed schema documentation
- `.env.example` - Environment variable reference
- `prisma/schema.prisma` - Complete schema definition

## Support & Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Discord Community](https://discord.gg/prisma)
