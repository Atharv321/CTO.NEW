const bcrypt = require('bcrypt');
const db = require('../src/db');

async function setupTestDatabase() {
  // Clear all tables
  await db.query('DELETE FROM bookings');
  await db.query('DELETE FROM availability_overrides');
  await db.query('DELETE FROM availability_templates');
  await db.query('DELETE FROM barbers');
  await db.query('DELETE FROM services');
  await db.query('DELETE FROM magic_links');
  await db.query('DELETE FROM admins');

  // Create test admin
  const passwordHash = await bcrypt.hash('testpassword', 10);
  await db.query(
    'INSERT INTO admins (email, password_hash, name) VALUES ($1, $2, $3)',
    ['admin@test.com', passwordHash, 'Test Admin']
  );

  // Create test barber
  const barberResult = await db.query(
    'INSERT INTO barbers (name, email, phone, active) VALUES ($1, $2, $3, $4) RETURNING id',
    ['John Doe', 'john@example.com', '555-1234', true]
  );
  const barberId = barberResult.rows[0].id;

  // Create test service
  const serviceResult = await db.query(
    'INSERT INTO services (name, description, duration_minutes, price, active) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    ['Haircut', 'Standard haircut', 30, 25.00, true]
  );
  const serviceId = serviceResult.rows[0].id;

  return { barberId, serviceId };
}

async function cleanupTestDatabase() {
  await db.query('DELETE FROM bookings');
  await db.query('DELETE FROM availability_overrides');
  await db.query('DELETE FROM availability_templates');
  await db.query('DELETE FROM barbers');
  await db.query('DELETE FROM services');
  await db.query('DELETE FROM magic_links');
  await db.query('DELETE FROM admins');
}

module.exports = {
  setupTestDatabase,
  cleanupTestDatabase,
};
