# Prisma + PostgreSQL Quick Reference

## Installation & Setup

```bash
# 1. Install dependencies
cd apps/api
pnpm install

# 2. Configure database connection
# Edit or create .env file:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/barber_booking_db

# 3. Run migrations
pnpm run migrate:dev

# 4. Seed sample data
pnpm run seed

# 5. Verify setup (opens GUI)
pnpm run prisma:studio
```

## Common Tasks

### Query Data

```typescript
import prisma from './database/prisma.js';

// Find many
const bookings = await prisma.booking.findMany({
  where: { status: 'confirmed' },
  take: 10,
  skip: 0,
  orderBy: { scheduledAt: 'asc' }
});

// Find unique
const customer = await prisma.customer.findUnique({
  where: { email: 'john@example.com' },
  include: { bookings: true }
});

// Find first
const pending = await prisma.booking.findFirst({
  where: { status: 'pending' }
});
```

### Create Data

```typescript
// Simple create
const customer = await prisma.customer.create({
  data: {
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    phone: '555-1234'
  }
});

// Create with relationships
const booking = await prisma.booking.create({
  data: {
    customerId: 'customer-id',
    barberId: 'barber-id',
    serviceId: 'service-id',
    scheduledAt: new Date('2024-01-15T10:00:00'),
    durationMinutes: 30,
    status: 'pending'
  },
  include: { customer: true, barber: true, service: true }
});
```

### Update Data

```typescript
// Update single
await prisma.booking.update({
  where: { id: 'booking-id' },
  data: { status: 'confirmed' }
});

// Update many
await prisma.booking.updateMany({
  where: { barberId: 'barber-id' },
  data: { isActive: false }
});
```

### Delete Data

```typescript
// Delete single
await prisma.booking.delete({
  where: { id: 'booking-id' }
});

// Delete many
await prisma.booking.deleteMany({
  where: { status: 'cancelled' }
});
```

### Transactions

```typescript
// Multiple operations (all or nothing)
const result = await prisma.$transaction(async (tx) => {
  const customer = await tx.customer.create({
    data: { email, firstName, lastName }
  });
  
  const booking = await tx.booking.create({
    data: {
      customerId: customer.id,
      barberId, serviceId, scheduledAt, durationMinutes
    }
  });
  
  return { customer, booking };
});
```

## Availability Management

### Get Shop Hours (Global)

```typescript
const hours = await prisma.availability.findMany({
  orderBy: { dayOfWeek: 'asc' }
});

// Example output:
// [
//   { dayOfWeek: 0, isWorkingDay: false },     // Sunday
//   { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' }, // Monday
//   ...
// ]
```

### Check if Shop is Open Today

```typescript
const today = new Date();
const dayOfWeek = today.getDay();

const availability = await prisma.availability.findUnique({
  where: { dayOfWeek }
});

if (availability?.isWorkingDay) {
  console.log(`Shop is open: ${availability.startTime} - ${availability.endTime}`);
} else {
  console.log('Shop is closed');
}
```

### Create Holiday Override

```typescript
await prisma.availabilityOverride.create({
  data: {
    date: new Date('2024-12-25'), // Christmas
    startTime: '00:00',
    endTime: '00:00',
    isAvailable: false,
    reason: 'Christmas Holiday'
  }
});
```

### Create Per-Barber Custom Hours

```typescript
await prisma.availabilityOverride.create({
  data: {
    barberId: 'john-smith-id',
    date: new Date('2024-01-15'),
    startTime: '10:00',
    endTime: '14:00',
    isAvailable: true,
    reason: 'Part-time shift'
  }
});
```

## Booking Operations

### Get Barber's Schedule

```typescript
const schedule = await prisma.booking.findMany({
  where: {
    barberId: 'barber-id',
    scheduledAt: {
      gte: new Date('2024-01-01'),
      lte: new Date('2024-01-31')
    }
  },
  include: {
    customer: { select: { firstName: true, lastName: true, phone: true } },
    service: { select: { name: true, durationMinutes: true } }
  },
  orderBy: { scheduledAt: 'asc' }
});
```

### Get Customer's Bookings

```typescript
const bookings = await prisma.booking.findMany({
  where: { customerId: 'customer-id' },
  include: {
    barber: { select: { name: true } },
    service: { select: { name: true, price: true } }
  },
  orderBy: { scheduledAt: 'desc' }
});
```

### Confirm Booking

```typescript
await prisma.booking.update({
  where: { id: 'booking-id' },
  data: { status: 'confirmed' }
});
```

### Cancel Booking

```typescript
await prisma.booking.update({
  where: { id: 'booking-id' },
  data: {
    status: 'cancelled',
    cancellationReason: 'Customer requested',
    cancelledAt: new Date()
  }
});
```

### Get Pending Bookings (to process)

```typescript
const pending = await prisma.booking.findMany({
  where: { status: 'pending' },
  take: 50,
  orderBy: { createdAt: 'asc' }
});
```

## Notification Operations

### Log Notification

```typescript
await prisma.notificationLog.create({
  data: {
    customerId: 'customer-id',
    type: 'email',
    subject: 'Booking Confirmation',
    message: 'Your booking is confirmed for January 15 at 10:00 AM',
    status: 'pending'
  }
});
```

### Get Pending Notifications to Send

```typescript
const pending = await prisma.notificationLog.findMany({
  where: { status: 'pending' },
  take: 100,
  orderBy: { createdAt: 'asc' }
});
```

### Mark Notification as Sent

```typescript
await prisma.notificationLog.update({
  where: { id: 'notification-id' },
  data: {
    status: 'sent',
    sentAt: new Date()
  }
});
```

### Mark Notification as Failed

```typescript
await prisma.notificationLog.update({
  where: { id: 'notification-id' },
  data: {
    status: 'failed',
    failureReason: 'Invalid email address'
  }
});
```

### Get Customer Notification History

```typescript
const history = await prisma.notificationLog.findMany({
  where: { customerId: 'customer-id' },
  orderBy: { createdAt: 'desc' },
  take: 50
});
```

## Data Models Overview

### Customer
```typescript
{
  id: string,
  email: string (unique),
  phone?: string,
  firstName: string,
  lastName: string,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Barber
```typescript
{
  id: string,
  name: string,
  email?: string (unique),
  phone?: string,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Service
```typescript
{
  id: string,
  name: string,
  description?: string,
  durationMinutes: number,
  price: Decimal,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Booking
```typescript
{
  id: string,
  customerId: string,
  barberId: string,
  serviceId: string,
  scheduledAt: Date,
  durationMinutes: number,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show',
  notes?: string,
  cancellationReason?: string,
  cancelledAt?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Availability
```typescript
{
  id: string,
  dayOfWeek: 0-6, // 0 = Sunday, 6 = Saturday
  startTime: string, // "09:00"
  endTime: string, // "18:00"
  isWorkingDay: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### AvailabilityOverride
```typescript
{
  id: string,
  barberId?: string, // null = system-wide
  date: Date,
  startTime: string,
  endTime: string,
  isAvailable: boolean,
  reason?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### NotificationLog
```typescript
{
  id: string,
  customerId?: string,
  barberId?: string,
  bookingId?: string,
  type: 'email' | 'sms' | 'push' | 'in-app',
  subject?: string,
  message: string,
  status: 'pending' | 'sent' | 'failed' | 'bounced',
  sentAt?: Date,
  failureReason?: string,
  createdAt: Date,
  updatedAt: Date
}
```

## Schema & Migration Commands

```bash
# View schema in GUI
pnpm run prisma:studio

# Create new migration
pnpm run migrate:dev --name add_new_field

# Deploy migrations to production
pnpm run migrate

# Reset database (WARNING: deletes all data!)
pnpm run migrate:reset --force

# Regenerate Prisma Client
pnpm run prisma:generate

# Seed database with sample data
pnpm run seed
```

## Useful Filters

```typescript
// Where conditions
where: {
  status: 'confirmed',                                    // Exact match
  status: { in: ['pending', 'confirmed'] },              // Multiple values
  status: { not: 'cancelled' },                           // Not equal
  price: { gt: 25 },                                      // Greater than
  price: { gte: 25, lte: 50 },                           // Range
  email: { contains: '@example.com', mode: 'insensitive' }, // Text search
  createdAt: { gte: new Date('2024-01-01') },            // Date range
  AND: [{ barberId: 'id1' }, { status: 'confirmed' }],   // Multiple conditions
  OR: [{ status: 'pending' }, { status: 'confirmed' }]   // OR condition
}
```

## Error Handling

```typescript
import { Prisma } from '@prisma/client';

try {
  await prisma.customer.create({ data });
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2002') {
      // Unique constraint violation
      console.log('Email already exists');
    }
    if (e.code === 'P2014') {
      // Relation constraint violation (RESTRICT)
      console.log('Cannot delete, has related records');
    }
  }
}
```

## Performance Tips

1. **Use select/include to limit fields**
   ```typescript
   include: { customer: { select: { name: true, email: true } } }
   ```

2. **Paginate large result sets**
   ```typescript
   findMany({ take: 20, skip: pageNumber * 20 })
   ```

3. **Use indexes** - Already defined on:
   - Booking: customerId, barberId, serviceId, scheduledAt, status
   - NotificationLog: customerId, barberId, type, status

4. **Use transactions** for multi-step operations
   ```typescript
   await prisma.$transaction(async (tx) => { ... })
   ```

## Troubleshooting

```bash
# Test database connection
DATABASE_URL="..." npx prisma db execute --stdin

# Check if Prisma Client is generated
ls node_modules/.prisma/client

# View migration history
npx prisma migrate status

# Diagnose issues
npx prisma introspect  # Compare DB with schema
npx prisma validate    # Check schema syntax
```

## Links & Resources

- Schema Design: `docs/SCHEMA_DESIGN.md`
- Setup Guide: `docs/PRISMA_SETUP.md`
- Prisma Docs: https://www.prisma.io/docs/
- PostgreSQL: https://www.postgresql.org/docs/
