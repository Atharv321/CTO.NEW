const { prisma } = require('../lib/prisma');

const seedData = async () => {
  try {
    console.log('Starting database seeding...');

    // Create services
    const services = await Promise.all([
      prisma.service.create({
        data: {
          name: 'Classic Haircut',
          description: 'Standard haircut with scissors and clippers',
          duration: 30,
          price: 25.00
        }
      }),
      prisma.service.create({
        data: {
          name: 'Beard Trim',
          description: 'Professional beard trimming and shaping',
          duration: 15,
          price: 15.00
        }
      }),
      prisma.service.create({
        data: {
          name: 'Haircut & Beard',
          description: 'Complete haircut and beard trim package',
          duration: 45,
          price: 35.00
        }
      }),
      prisma.service.create({
        data: {
          name: 'Kids Haircut',
          description: 'Haircut for children under 12',
          duration: 25,
          price: 20.00
        }
      }),
      prisma.service.create({
        data: {
          name: 'Senior Style',
          description: 'Haircut for seniors 65+',
          duration: 30,
          price: 18.00
        }
      })
    ]);

    console.log('Created services:', services.length);

    // Create barbers
    const barbers = await Promise.all([
      prisma.barber.create({
        data: {
          name: 'John Smith',
          email: 'john@barbershop.com',
          phone: '+1-555-0101',
          bio: 'Experienced barber with 10+ years in classic cuts'
        }
      }),
      prisma.barber.create({
        data: {
          name: 'Maria Garcia',
          email: 'maria@barbershop.com',
          phone: '+1-555-0102',
          bio: 'Specialist in modern styles and fades'
        }
      }),
      prisma.barber.create({
        data: {
          name: 'David Chen',
          email: 'david@barbershop.com',
          phone: '+1-555-0103',
          bio: 'Expert in traditional Asian barbering techniques'
        }
      })
    ]);

    console.log('Created barbers:', barbers.length);

    // Create availability for each barber
    const availabilityPromises = [];
    
    for (const barber of barbers) {
      // Monday - Friday: 9 AM - 6 PM
      for (let day = 1; day <= 5; day++) {
        availabilityPromises.push(
          prisma.availability.create({
            data: {
              barberId: barber.id,
              dayOfWeek: day,
              startTime: '09:00',
              endTime: '18:00'
            }
          })
        );
      }
      
      // Saturday: 8 AM - 4 PM
      availabilityPromises.push(
        prisma.availability.create({
          data: {
            barberId: barber.id,
            dayOfWeek: 6,
            startTime: '08:00',
            endTime: '16:00'
          }
        })
      );
      
      // Sunday: Closed (no availability)
    }

    await Promise.all(availabilityPromises);
    console.log('Created availability schedules');

    // Create sample customers
    const customers = await Promise.all([
      prisma.customer.create({
        data: {
          name: 'Alice Johnson',
          email: 'alice.johnson@email.com',
          phone: '+1-555-1001'
        }
      }),
      prisma.customer.create({
        data: {
          name: 'Bob Wilson',
          email: 'bob.wilson@email.com',
          phone: '+1-555-1002'
        }
      }),
      prisma.customer.create({
        data: {
          name: 'Charlie Brown',
          email: 'charlie.brown@email.com',
          phone: '+1-555-1003'
        }
      }),
      prisma.customer.create({
        data: {
          name: 'Diana Prince',
          email: 'diana.prince@email.com',
          phone: '+1-555-1004'
        }
      }),
      prisma.customer.create({
        data: {
          name: 'Edward Norton',
          email: 'edward.norton@email.com',
          phone: '+1-555-1005'
        }
      })
    ]);

    console.log('Created customers:', customers.length);

    // Create some sample bookings for the past and future
    const now = new Date();
    const bookings = [];

    // Past bookings (completed)
    for (let i = 0; i < 5; i++) {
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - (i + 1));
      pastDate.setHours(10 + i, 0, 0, 0);
      
      const endTime = new Date(pastDate);
      endTime.setMinutes(endTime.getMinutes() + services[0].duration);

      bookings.push(
        prisma.booking.create({
          data: {
            customerId: customers[i].id,
            barberId: barbers[i % barbers.length].id,
            serviceId: services[0].id,
            startTime: pastDate,
            endTime: endTime,
            status: 'COMPLETED',
            notes: 'Regular customer'
          }
        })
      );
    }

    // Future bookings (confirmed)
    for (let i = 0; i < 3; i++) {
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + (i + 1));
      futureDate.setHours(14 + i, 0, 0, 0);
      
      const endTime = new Date(futureDate);
      endTime.setMinutes(endTime.getMinutes() + services[i % services.length].duration);

      bookings.push(
        prisma.booking.create({
          data: {
            customerId: customers[i].id,
            barberId: barbers[(i + 1) % barbers.length].id,
            serviceId: services[i % services.length].id,
            startTime: futureDate,
            endTime: endTime,
            status: 'CONFIRMED',
            notes: 'Future appointment'
          }
        })
      );
    }

    await Promise.all(bookings);
    console.log('Created sample bookings:', bookings.length);

    console.log('Database seeding completed successfully!');
    console.log('\nSummary:');
    console.log(`- Services: ${services.length}`);
    console.log(`- Barbers: ${barbers.length}`);
    console.log(`- Customers: ${customers.length}`);
    console.log(`- Bookings: ${bookings.length}`);
    console.log(`- Availability schedules: ${availabilityPromises.length}`);

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedData };
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
const pool = require('../src/db/connection');

async function seedDatabase() {
  console.log('Seeding database with sample data...');

  try {
    // Create sample locations
    console.log('Creating locations...');
    const location1 = await pool.query(`
      INSERT INTO locations (name, address)
      VALUES ('Main Warehouse', '123 Storage Street, City, ST 12345')
      ON CONFLICT DO NOTHING
      RETURNING id
    `);

    const location2 = await pool.query(`
      INSERT INTO locations (name, address)
      VALUES ('Downtown Store', '456 Retail Ave, City, ST 12345')
      ON CONFLICT DO NOTHING
      RETURNING id
    `);

    // Create sample items
    console.log('Creating items...');
    const items = [
      { sku: 'WIDGET-001', barcode: '1234567890', name: 'Premium Widget', price: 19.99, qty: 100 },
      { sku: 'GADGET-001', barcode: '0987654321', name: 'Super Gadget', price: 29.99, qty: 75 },
      { sku: 'TOOL-001', barcode: '5555555555', name: 'Professional Tool', price: 49.99, qty: 50 },
      { sku: 'SUPPLY-001', barcode: '1111111111', name: 'Office Supply Pack', price: 9.99, qty: 200 },
      { sku: 'PART-001', barcode: '2222222222', name: 'Replacement Part', price: 14.99, qty: 150 }
    ];

    const itemIds = [];
    for (const item of items) {
      const result = await pool.query(`
        INSERT INTO items (sku, barcode, name, unit_price, quantity, category, status)
        VALUES ($1, $2, $3, $4, $5, 'general', 'active')
        ON CONFLICT (sku) DO UPDATE SET
          barcode = EXCLUDED.barcode,
          name = EXCLUDED.name,
          unit_price = EXCLUDED.unit_price
        RETURNING id
      `, [item.sku, item.barcode, item.name, item.price, item.qty]);
      itemIds.push(result.rows[0].id);
    }

    // Create sample suppliers
    console.log('Creating suppliers...');
    const supplier1 = await pool.query(`
      INSERT INTO suppliers (name, contact_name, contact_email, contact_phone, address, lead_time_days, notes)
      VALUES (
        'Acme Wholesale',
        'John Smith',
        'john@acmewholesale.com',
        '555-0100',
        '789 Industrial Blvd, Manufacturing City, ST 54321',
        7,
        'Primary supplier for widgets and gadgets'
      )
      RETURNING id
    `);
    const supplierId1 = supplier1.rows[0].id;

    const supplier2 = await pool.query(`
      INSERT INTO suppliers (name, contact_name, contact_email, contact_phone, address, lead_time_days, notes)
      VALUES (
        'Quality Parts Inc',
        'Jane Doe',
        'jane@qualityparts.com',
        '555-0200',
        '321 Commerce Way, Business Town, ST 98765',
        5,
        'Best pricing on replacement parts'
      )
      RETURNING id
    `);
    const supplierId2 = supplier2.rows[0].id;

    // Link suppliers to locations
    console.log('Linking suppliers to locations...');
    if (location1.rows.length > 0) {
      await pool.query(`
        INSERT INTO supplier_locations (supplier_id, location_id)
        VALUES ($1, $2), ($3, $2)
        ON CONFLICT DO NOTHING
      `, [supplierId1, location1.rows[0].id, supplierId2]);
    }

    // Add preferred items to suppliers
    console.log('Adding preferred items...');
    if (itemIds.length >= 5) {
      // Acme Wholesale preferred items
      await pool.query(`
        INSERT INTO supplier_preferred_items (supplier_id, item_id, supplier_sku, unit_price, minimum_order_quantity)
        VALUES 
          ($1, $2, 'ACM-WIDGET-001', 17.99, 10),
          ($1, $3, 'ACM-GADGET-001', 27.99, 5),
          ($1, $4, 'ACM-TOOL-001', 44.99, 2)
        ON CONFLICT (supplier_id, item_id) DO UPDATE SET
          unit_price = EXCLUDED.unit_price
      `, [supplierId1, itemIds[0], itemIds[1], itemIds[2]]);

      // Quality Parts Inc preferred items
      await pool.query(`
        INSERT INTO supplier_preferred_items (supplier_id, item_id, supplier_sku, unit_price, minimum_order_quantity)
        VALUES 
          ($1, $2, 'QPI-PART-001', 12.99, 20),
          ($1, $3, 'QPI-SUPPLY-001', 8.99, 50)
        ON CONFLICT (supplier_id, item_id) DO UPDATE SET
          unit_price = EXCLUDED.unit_price
      `, [supplierId2, itemIds[4], itemIds[3]]);
    }

    console.log('Database seeded successfully!');
    console.log(`Created ${itemIds.length} items`);
    console.log(`Created 2 suppliers`);
    console.log(`Created 2 locations`);
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedDatabase();
