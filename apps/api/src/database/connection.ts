import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/inventory_db',
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  end: () => pool.end(),
};

export default db;