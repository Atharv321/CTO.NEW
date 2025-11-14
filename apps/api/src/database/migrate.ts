import db from './connection.js';
import migrations from './migrations.js';

async function runMigrations() {
  try {
    // Create migrations table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get executed migrations
    const result = await db.query('SELECT name FROM schema_migrations ORDER BY name');
    const executedMigrations = new Set(result.rows.map(row => row.name));

    // Run pending migrations
    for (const migration of migrations) {
      if (!executedMigrations.has(migration.name)) {
        console.log(`Running migration: ${migration.name}`);
        
        await db.query('BEGIN');
        try {
          await db.query(migration.up);
          await db.query('INSERT INTO schema_migrations (name) VALUES ($1)', [migration.name]);
          await db.query('COMMIT');
          console.log(`Migration ${migration.name} completed successfully`);
        } catch (error) {
          await db.query('ROLLBACK');
          console.error(`Migration ${migration.name} failed:`, error);
          throw error;
        }
      } else {
        console.log(`Migration ${migration.name} already executed, skipping`);
      }
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export default runMigrations;