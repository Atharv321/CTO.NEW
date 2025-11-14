const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const url = process.env.DATABASE_URL || 'postgresql://localhost:5432/appdb';

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
