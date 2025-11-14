const { spawnSync } = require('child_process');

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
