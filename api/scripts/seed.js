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