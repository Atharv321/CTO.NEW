/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const roleSeedData = [
  {
    name: 'admin',
    description: 'Full administrative access across the platform.',
  },
  {
    name: 'manager',
    description: 'Manages purchasing, inventory operations, and reporting.',
  },
  {
    name: 'staff',
    description: 'Performs receiving, stock counts, and day-to-day tasks.',
  },
];

const locationSeedData = [
  {
    code: 'NYC-001',
    name: 'New York Flagship',
    description: 'Primary distribution hub for east coast operations.',
    addressLine1: '123 Market St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'USA',
    timezone: 'America/New_York',
  },
  {
    code: 'SFO-001',
    name: 'San Francisco Warehouse',
    description: 'West coast fulfillment and receiving center.',
    addressLine1: '500 Embarcadero',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94105',
    country: 'USA',
    timezone: 'America/Los_Angeles',
  },
  {
    code: 'LDN-001',
    name: 'London Retail',
    description: 'European retail storefront with limited stock.',
    addressLine1: '1 Baker Street',
    city: 'London',
    country: 'UK',
    postalCode: 'NW1 6XE',
    timezone: 'Europe/London',
  },
];

async function upsertRoles() {
  for (const role of roleSeedData) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
      },
      create: role,
    });
  }
}

async function upsertLocations() {
  for (const location of locationSeedData) {
    await prisma.location.upsert({
      where: { code: location.code },
      update: {
        name: location.name,
        description: location.description,
        addressLine1: location.addressLine1,
        addressLine2: location.addressLine2,
        city: location.city,
        state: location.state,
        postalCode: location.postalCode,
        country: location.country,
        timezone: location.timezone,
      },
      create: {
        ...location,
      },
    });
  }
}

async function main() {
  console.log('Starting Prisma seed for reference data...');
  await upsertRoles();
  await upsertLocations();
  console.log('Reference data seeded successfully.');
}

main()
  .catch((error) => {
    console.error('Prisma seed failed.');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
