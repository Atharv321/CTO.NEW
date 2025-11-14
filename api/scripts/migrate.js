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
    const migrationsDir = path.join(__dirname, '../migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found. Skipping migrations.');
      return;
    }
    
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    if (files.length === 0) {
      console.log('No migration files found. Skipping migrations.');
      return;
    }
    
    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      await pool.query(sql);
      console.log(`✓ Migration ${file} completed`);
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
