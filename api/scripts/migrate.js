const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const url = process.env.DATABASE_URL || 'postgresql://localhost:5432/appdb';
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const url = process.env.DATABASE_URL || 'postgresql://devuser:devpassword@db:5432/appdb';

const sanitize = (connectionString) => {
  try {
    const parsed = new URL(connectionString);
    if (parsed.password) {
      parsed.password = '***';
    }
    return parsed.toString();
  } catch (error) {
    return 'unknown-database';
  }
};

async function runMigrations() {
  const client = new Client({ connectionString: url });
  
  try {
    await client.connect();
    console.log(`Connected to database: ${sanitize(url)}`);
    
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      console.log(`Running migration: ${file}`);
      await client.query(sql);
      console.log(`✓ Completed: ${file}`);
    }
    
    console.log('\n✓ All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
const run = (label, command) => {
  console.log(`Running step: ${label}`);
  const result = spawnSync(command, {
    env: process.env,
    stdio: 'inherit',
    shell: true,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${label} exited with status code ${result.status}`);
  }
};

(() => {
  try {
    console.log(`Running database migrations against ${sanitize(url)}`);

    run('Applying Prisma migrations', 'npx prisma migrate deploy');

    if (process.env.SKIP_DB_SEED === 'true') {
      console.log('Skipping database seed because SKIP_DB_SEED is set to true.');
    } else {
      run('Seeding reference data', 'npx prisma db seed');
    }

    console.log('Database migrations completed successfully.');
  } catch (error) {
    console.error('Database migration failed.');
    console.error(error.message || error);
    process.exit(1);
  }
})();
async function runMigrations() {
  console.log(`Running migrations against ${sanitize(url)}`);
  
  const pool = new Pool({ connectionString: url });
  
  try {
    // Create migrations tracking table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../src/db/migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found, skipping migrations.');
      await pool.end();
      return;
    }
    
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${migrationFiles.length} migration file(s)`);
    
    for (const file of migrationFiles) {
      const version = file.replace('.sql', '');
      
      // Check if migration already executed
      const result = await pool.query(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [version]
      );
      
      if (result.rows.length > 0) {
        console.log(`Skipping migration ${version} (already executed)`);
        continue;
      }
      
      console.log(`Executing migration ${version}...`);
      
      // Read and execute migration
      const migrationPath = path.join(migrationsDir, file);
      const migrationSql = fs.readFileSync(migrationPath, 'utf8');
      
      await pool.query(migrationSql);
      
      // Record migration
      await pool.query(
        'INSERT INTO schema_migrations (version) VALUES ($1)',
        [version]
      );
      
      console.log(`Migration ${version} completed successfully`);
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
