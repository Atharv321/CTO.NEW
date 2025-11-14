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

console.log(`Running migrations against ${sanitize(url)} (placeholder).`);
