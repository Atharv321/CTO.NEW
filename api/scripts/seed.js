const bcrypt = require('bcrypt');
const db = require('../src/db');
const { runMigrations } = require('../src/db/migrations');

async function seed() {
  try {
    console.log('Running migrations...');
    await runMigrations();

    console.log('Seeding database...');

    // Create admin user
    const passwordHash = await bcrypt.hash('admin123', 10);
    const adminResult = await db.query(
      `INSERT INTO admins (email, password_hash, name) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['admin@barbershop.com', passwordHash, 'Admin User']
    );

    if (adminResult.rows.length > 0) {
      console.log('✓ Created admin user (email: admin@barbershop.com, password: admin123)');
    } else {
      console.log('✓ Admin user already exists');
    }

    // Create barbers
    const barber1 = await db.query(
      `INSERT INTO barbers (name, email, phone, active) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['Mike Johnson', 'mike@barbershop.com', '555-0101', true]
    );

    const barber2 = await db.query(
      `INSERT INTO barbers (name, email, phone, active) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['Sarah Williams', 'sarah@barbershop.com', '555-0102', true]
    );

    console.log('✓ Created barbers');

    // Create services
    const services = [
      ['Haircut', 'Standard haircut with wash and styling', 30, 25.00],
      ['Beard Trim', 'Professional beard trim and shaping', 20, 15.00],
      ['Haircut & Beard', 'Complete haircut and beard service', 45, 35.00],
      ['Kids Haircut', 'Haircut for children under 12', 20, 18.00],
      ['Hot Towel Shave', 'Traditional hot towel shave', 30, 30.00],
    ];

    for (const [name, description, duration, price] of services) {
      await db.query(
        `INSERT INTO services (name, description, duration_minutes, price, active)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [name, description, duration, price, true]
      );
    }

    console.log('✓ Created services');

    // Create availability templates for barbers (if we have barber IDs)
    if (barber1.rows.length > 0 && barber2.rows.length > 0) {
      const barberId1 = barber1.rows[0].id;
      const barberId2 = barber2.rows[0].id;

      // Mike's availability (Monday-Friday, 9am-5pm)
      for (let day = 1; day <= 5; day++) {
        await db.query(
          `INSERT INTO availability_templates (barber_id, day_of_week, start_time, end_time)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (barber_id, day_of_week, start_time) DO NOTHING`,
          [barberId1, day, '09:00', '17:00']
        );
      }

      // Sarah's availability (Tuesday-Saturday, 10am-6pm)
      for (let day = 2; day <= 6; day++) {
        await db.query(
          `INSERT INTO availability_templates (barber_id, day_of_week, start_time, end_time)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (barber_id, day_of_week, start_time) DO NOTHING`,
          [barberId2, day, '10:00', '18:00']
        );
      }

      console.log('✓ Created availability templates');
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\nYou can now login with:');
    console.log('  Email: admin@barbershop.com');
    console.log('  Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
