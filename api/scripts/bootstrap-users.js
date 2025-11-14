require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const authService = require('../services/authService');

const prisma = new PrismaClient();

async function bootstrapUsers() {
  try {
    console.log('Starting bootstrap user creation...');

    const roles = await prisma.role.findMany();
    if (roles.length === 0) {
      console.log('Creating roles...');
      await prisma.role.createMany({
        data: [
          {
            name: 'admin',
            description: 'Administrator with full system access',
          },
          {
            name: 'manager',
            description: 'Manager with access to manage locations and staff',
          },
          {
            name: 'staff',
            description: 'Staff member with access to inventory operations',
          },
          {
            name: 'user',
            description: 'Regular user with limited access',
          },
        ],
        skipDuplicates: true,
      });
      console.log('Roles created successfully');
    }

    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    });

    if (!existingAdmin) {
      console.log('Creating bootstrap admin user...');
      const admin = await authService.createBootstrapUser(
        'admin@example.com',
        'Admin',
        'User',
        'AdminPassword123!',
        'admin'
      );
      console.log('✓ Admin user created:', admin.email);
    } else {
      console.log('✓ Admin user already exists:', existingAdmin.email);
    }

    const existingManager = await prisma.user.findUnique({
      where: { email: 'manager@example.com' },
    });

    if (!existingManager) {
      console.log('Creating bootstrap manager user...');
      const manager = await authService.createBootstrapUser(
        'manager@example.com',
        'Manager',
        'User',
        'ManagerPassword123!',
        'manager'
      );
      console.log('✓ Manager user created:', manager.email);
    } else {
      console.log('✓ Manager user already exists:', existingManager.email);
    }

    const existingStaff = await prisma.user.findUnique({
      where: { email: 'staff@example.com' },
    });

    if (!existingStaff) {
      console.log('Creating bootstrap staff user...');
      const staff = await authService.createBootstrapUser(
        'staff@example.com',
        'Staff',
        'User',
        'StaffPassword123!',
        'staff'
      );
      console.log('✓ Staff user created:', staff.email);
    } else {
      console.log('✓ Staff user already exists:', existingStaff.email);
    }

    console.log('\n✓ Bootstrap complete!');
    console.log('\nDefault test users:');
    console.log('  Admin:   admin@example.com / AdminPassword123!');
    console.log('  Manager: manager@example.com / ManagerPassword123!');
    console.log('  Staff:   staff@example.com / StaffPassword123!');
  } catch (error) {
    console.error('Bootstrap failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

bootstrapUsers();
