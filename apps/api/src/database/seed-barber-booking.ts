import prisma from './prisma.js';
import bcrypt from 'bcryptjs';

async function seedBarberingSystem() {
  try {
    console.log('Starting to seed barber booking system...');

    // Seed Admin Users
    console.log('Seeding admin users...');
    await prisma.adminUser.createMany({
      data: [
        {
          email: 'admin@barberapp.com',
          name: 'Admin User',
          passwordHash: await bcrypt.hash('admin123', 10),
          role: 'admin',
          isActive: true,
        },
        {
          email: 'manager@barberapp.com',
          name: 'Manager User',
          passwordHash: await bcrypt.hash('manager123', 10),
          role: 'manager',
          isActive: true,
        },
        {
          email: 'support@barberapp.com',
          name: 'Support User',
          passwordHash: await bcrypt.hash('support123', 10),
          role: 'support',
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    // Seed Services
    console.log('Seeding services...');
    const services = await prisma.service.createMany({
      data: [
        {
          name: 'Basic Haircut',
          description: 'Standard haircut with clippers and scissors',
          durationMinutes: 30,
          price: 25.0,
          isActive: true,
        },
        {
          name: 'Premium Haircut',
          description: 'Premium haircut with styling and finishing',
          durationMinutes: 45,
          price: 40.0,
          isActive: true,
        },
        {
          name: 'Beard Trim',
          description: 'Professional beard shaping and trim',
          durationMinutes: 20,
          price: 15.0,
          isActive: true,
        },
        {
          name: 'Beard Shave',
          description: 'Complete beard shave with hot lather',
          durationMinutes: 25,
          price: 20.0,
          isActive: true,
        },
        {
          name: 'Haircut + Beard Trim',
          description: 'Combination haircut and beard trim',
          durationMinutes: 50,
          price: 40.0,
          isActive: true,
        },
        {
          name: 'Kids Haircut',
          description: 'Haircut for children',
          durationMinutes: 25,
          price: 18.0,
          isActive: true,
        },
        {
          name: 'Hair Coloring',
          description: 'Professional hair coloring service',
          durationMinutes: 60,
          price: 50.0,
          isActive: true,
        },
        {
          name: 'Fade Cut',
          description: 'Modern fade haircut',
          durationMinutes: 35,
          price: 30.0,
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    console.log(`Created ${services.count} services`);

    // Seed Barbers
    console.log('Seeding barbers...');
    const barbers = await prisma.barber.createMany({
      data: [
        {
          name: 'John Smith',
          email: 'john@barberapp.com',
          phone: '555-0101',
          isActive: true,
        },
        {
          name: 'Michael Johnson',
          email: 'michael@barberapp.com',
          phone: '555-0102',
          isActive: true,
        },
        {
          name: 'Robert Williams',
          email: 'robert@barberapp.com',
          phone: '555-0103',
          isActive: true,
        },
        {
          name: 'James Brown',
          email: 'james@barberapp.com',
          phone: '555-0104',
          isActive: true,
        },
        {
          name: 'David Martinez',
          email: 'david@barberapp.com',
          phone: '555-0105',
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    console.log(`Created ${barbers.count} barbers`);

    // Seed Default Availability (Global working hours)
    console.log('Seeding global availability...');
    const availability = [
      // Monday - Friday: 9 AM - 6 PM
      { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isWorkingDay: true },
      { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isWorkingDay: true },
      { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isWorkingDay: true },
      { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isWorkingDay: true },
      { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', isWorkingDay: true },
      // Saturday: 10 AM - 4 PM
      { dayOfWeek: 6, startTime: '10:00', endTime: '16:00', isWorkingDay: true },
      // Sunday: Closed
      { dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isWorkingDay: false },
    ];

    await prisma.availability.createMany({
      data: availability,
      skipDuplicates: true,
    });

    console.log('Global availability schedule created');

    // Seed Customers
    console.log('Seeding sample customers...');
    const customers = await prisma.customer.createMany({
      data: [
        {
          email: 'customer1@example.com',
          firstName: 'Alex',
          lastName: 'Anderson',
          phone: '555-1001',
          isActive: true,
        },
        {
          email: 'customer2@example.com',
          firstName: 'Brian',
          lastName: 'Bennett',
          phone: '555-1002',
          isActive: true,
        },
        {
          email: 'customer3@example.com',
          firstName: 'Chris',
          lastName: 'Carter',
          phone: '555-1003',
          isActive: true,
        },
        {
          email: 'customer4@example.com',
          firstName: 'Daniel',
          lastName: 'Davis',
          phone: '555-1004',
          isActive: true,
        },
        {
          email: 'customer5@example.com',
          firstName: 'Eric',
          lastName: 'Evans',
          phone: '555-1005',
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    console.log(`Created ${customers.count} customers`);

    // Seed sample bookings
    console.log('Seeding sample bookings...');
    const serviceList = await prisma.service.findMany();
    const barberList = await prisma.barber.findMany();
    const customerList = await prisma.customer.findMany();

    if (serviceList.length > 0 && barberList.length > 0 && customerList.length > 0) {
      const bookings = [];
      const now = new Date();

      // Create bookings for the next 14 days
      for (let i = 0; i < 10; i++) {
        const bookingDate = new Date(now);
        bookingDate.setDate(bookingDate.getDate() + Math.floor(Math.random() * 14));
        bookingDate.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 4) * 15, 0, 0);

        const service = serviceList[Math.floor(Math.random() * serviceList.length)];
        const barber = barberList[Math.floor(Math.random() * barberList.length)];
        const customer = customerList[Math.floor(Math.random() * customerList.length)];

        bookings.push({
          customerId: customer.id,
          barberId: barber.id,
          serviceId: service.id,
          scheduledAt: bookingDate,
          durationMinutes: service.durationMinutes,
          status: 'confirmed',
          notes: `Booking for ${service.name}`,
        });
      }

      const createdBookings = await prisma.booking.createMany({
        data: bookings,
      });

      console.log(`Created ${createdBookings.count} sample bookings`);
    }

    console.log('✓ Barber booking system seeding completed successfully');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedBarberingSystem();
}

export default seedBarberingSystem;
