const db = require('./index');

const migrations = [
  {
    name: '001_create_admins_table',
    up: async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS admins (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
      `);
    },
  },
  {
    name: '002_create_services_table',
    up: async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS services (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          duration_minutes INTEGER NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    },
  },
  {
    name: '003_create_barbers_table',
    up: async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS barbers (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE,
          phone VARCHAR(50),
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    },
  },
  {
    name: '004_create_availability_templates_table',
    up: async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS availability_templates (
          id SERIAL PRIMARY KEY,
          barber_id INTEGER NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
          day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(barber_id, day_of_week, start_time)
        );
        
        CREATE INDEX IF NOT EXISTS idx_availability_barber ON availability_templates(barber_id);
      `);
    },
  },
  {
    name: '005_create_availability_overrides_table',
    up: async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS availability_overrides (
          id SERIAL PRIMARY KEY,
          barber_id INTEGER NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          start_time TIME,
          end_time TIME,
          is_available BOOLEAN NOT NULL,
          reason VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(barber_id, date)
        );
        
        CREATE INDEX IF NOT EXISTS idx_availability_overrides_barber_date 
          ON availability_overrides(barber_id, date);
      `);
    },
  },
  {
    name: '006_create_bookings_table',
    up: async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS bookings (
          id SERIAL PRIMARY KEY,
          barber_id INTEGER NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
          service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
          customer_name VARCHAR(255) NOT NULL,
          customer_email VARCHAR(255),
          customer_phone VARCHAR(50),
          booking_date DATE NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_bookings_barber ON bookings(barber_id);
        CREATE INDEX IF NOT EXISTS idx_bookings_service ON bookings(service_id);
        CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
        CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
      `);
    },
  },
  {
    name: '007_create_magic_links_table',
    up: async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS magic_links (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          used BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
        CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);
      `);
    },
  },
];

async function runMigrations() {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Get executed migrations
    const result = await client.query('SELECT name FROM migrations');
    const executedMigrations = new Set(result.rows.map((row) => row.name));
    
    // Run pending migrations
    for (const migration of migrations) {
      if (!executedMigrations.has(migration.name)) {
        console.log(`Running migration: ${migration.name}`);
        await migration.up();
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [
          migration.name,
        ]);
        console.log(`Completed migration: ${migration.name}`);
      }
    }
    
    await client.query('COMMIT');
    console.log('All migrations completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { runMigrations };
