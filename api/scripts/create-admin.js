const bcrypt = require('bcrypt');
const db = require('../src/db');
const { runMigrations } = require('../src/db/migrations');

async function createAdmin() {
  try {
    // Get email and password from command line or use defaults
    const email = process.argv[2] || 'admin@barbershop.com';
    const password = process.argv[3] || 'admin123';
    const name = process.argv[4] || 'Admin User';

    console.log('Running migrations...');
    await runMigrations();

    console.log('Creating admin user...');
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO admins (email, password_hash, name) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (email) 
       DO UPDATE SET password_hash = $2, name = $3
       RETURNING id, email, name`,
      [email, passwordHash, name]
    );

    console.log('\n✅ Admin user created/updated successfully!');
    console.log(`\nEmail: ${result.rows[0].email}`);
    console.log(`Password: ${password}`);
    console.log(`Name: ${result.rows[0].name}`);

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
