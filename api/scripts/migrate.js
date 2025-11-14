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
