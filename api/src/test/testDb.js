const { Pool } = require('pg');

let testPool;

async function initTestDb() {
  testPool = new Pool({
    connectionString: process.env.DATABASE_URL_TEST || 'postgresql://localhost:5432/appdb_test',
  });
  return testPool;
}

async function cleanupTestDb() {
  if (testPool) {
    await testPool.end();
  }
}

async function resetTestDb() {
  if (!testPool) {
    await initTestDb();
  }

  const tables = [
    'stock_movements',
    'stock_levels',
    'items',
    'locations',
    'suppliers',
    'categories',
    'users',
  ];

  for (const table of tables) {
    try {
      await testPool.query(`TRUNCATE TABLE ${table} CASCADE`);
    } catch (error) {
      // Table might not exist
    }
  }
}

async function queryTestDb(query, params = []) {
  if (!testPool) {
    await initTestDb();
  }
  return testPool.query(query, params);
}

module.exports = {
  initTestDb,
  cleanupTestDb,
  resetTestDb,
  queryTestDb,
  getPool: () => testPool,
};
