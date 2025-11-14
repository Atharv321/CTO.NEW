const { prisma } = require('../lib/prisma');

const runMigrations = async () => {
  try {
    console.log('Running database migrations...');
    
    // Generate Prisma client
    const { execSync } = require('child_process');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Run migrations
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };