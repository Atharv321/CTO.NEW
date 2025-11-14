import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const getPool = () => pool;

export const query = (text: string, params?: unknown[]) => {
  return pool.query(text, params);
};

export const connect = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connected:', result.rows[0]);
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

export const disconnect = async () => {
  await pool.end();
};
