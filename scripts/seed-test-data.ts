/**
 * Seed script for populating test data
 * 
 * Usage:
 *   pnpm run seed:test-data [environment]
 */

const environments = ['development', 'staging', 'production'];
const environment = process.argv[2] || 'development';

if (!environments.includes(environment)) {
  console.error(`Invalid environment: ${environment}`);
  console.error(`Valid environments: ${environments.join(', ')}`);
  process.exit(1);
}

/**
 * Generate mock users
 */
function generateUsers(count: number = 10) {
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: i === 0 ? 'admin' : 'user',
    createdAt: new Date(),
  }));
}

/**
 * Generate mock bookings
 */
function generateBookings(count: number = 20) {
  const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  return Array.from({ length: count }, (_, i) => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + Math.floor(i / 5));
    return {
      id: `booking-${i + 1}`,
      userId: `user-${(i % 10) + 1}`,
      serviceId: `service-${(i % 5) + 1}`,
      startTime: new Date(baseDate.setHours(10 + (i % 8))),
      endTime: new Date(baseDate.setHours(11 + (i % 8))),
      status: statuses[i % statuses.length],
      createdAt: new Date(),
    };
  });
}

/**
 * Main seed function
 */
async function seed() {
  console.log(`🌱 Seeding test data for ${environment} environment...`);

  try {
    const users = generateUsers(10);
    const bookings = generateBookings(20);

    console.log(`✅ Generated ${users.length} users`);
    console.log(`✅ Generated ${bookings.length} bookings`);

    // TODO: Insert data into database
    // Example:
    // await db.users.insertMany(users);
    // await db.bookings.insertMany(bookings);

    console.log(`\n✨ Test data seeding complete!`);
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    process.exit(1);
  }
}

seed();

export { generateUsers, generateBookings };
