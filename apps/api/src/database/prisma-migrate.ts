import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../');

interface MigrationOptions {
  name?: string;
  force?: boolean;
  dryRun?: boolean;
}

/**
 * Run database migrations using Prisma
 * This is a TypeScript helper for running migrations programmatically
 */
export async function runMigrations(options: MigrationOptions = {}) {
  try {
    const { name, force = false, dryRun = false } = options;

    console.log('Starting Prisma migration process...');

    // Set working directory to project root (where prisma.json would be)
    process.chdir(projectRoot);

    if (name) {
      // Create a new migration
      console.log(`Creating migration: ${name}`);
      const cmd = `npx prisma migrate dev --name "${name}"${dryRun ? ' --skip-generate' : ''}`;
      execSync(cmd, { stdio: 'inherit' });
    } else {
      // Deploy existing migrations
      console.log('Deploying migrations...');
      const cmd = 'npx prisma migrate deploy';
      execSync(cmd, { stdio: 'inherit' });
    }

    console.log('✓ Migrations completed successfully');
  } catch (error) {
    console.error('✗ Migration failed:', error);
    throw error;
  }
}

/**
 * Reset database (WARNING: destructive!)
 */
export async function resetDatabase() {
  try {
    console.warn('⚠️  WARNING: This will delete all data in the database!');
    
    process.chdir(projectRoot);
    execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
    
    console.log('✓ Database reset completed');
  } catch (error) {
    console.error('✗ Database reset failed:', error);
    throw error;
  }
}

/**
 * Generate Prisma Client
 */
export async function generatePrismaClient() {
  try {
    console.log('Generating Prisma Client...');
    
    process.chdir(projectRoot);
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('✓ Prisma Client generated successfully');
  } catch (error) {
    console.error('✗ Prisma Client generation failed:', error);
    throw error;
  }
}

/**
 * Open Prisma Studio
 */
export async function openPrismaStudio() {
  try {
    console.log('Opening Prisma Studio...');
    
    process.chdir(projectRoot);
    execSync('npx prisma studio', { stdio: 'inherit' });
  } catch (error) {
    console.error('✗ Failed to open Prisma Studio:', error);
    throw error;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const options: MigrationOptions = {
    name: process.argv[3],
    force: process.argv.includes('--force'),
    dryRun: process.argv.includes('--dry-run'),
  };

  switch (command) {
    case 'migrate':
      runMigrations(options).catch(() => process.exit(1));
      break;
    case 'reset':
      resetDatabase().catch(() => process.exit(1));
      break;
    case 'generate':
      generatePrismaClient().catch(() => process.exit(1));
      break;
    case 'studio':
      openPrismaStudio().catch(() => process.exit(1));
      break;
    default:
      console.log('Usage: node prisma-migrate.ts [migrate|reset|generate|studio] [options]');
      process.exit(1);
  }
}

export default {
  runMigrations,
  resetDatabase,
  generatePrismaClient,
  openPrismaStudio,
};
