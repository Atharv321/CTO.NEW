# Database Migrations

This document provides guidelines for managing database schema changes through migrations.

## Overview

Database migrations are versioned schema changes that enable teams to evolve the database structure while maintaining data integrity and enabling rollback capabilities.

The API service includes a basic migration runner accessible via `npm run migrate` in the `api/` directory.

## Migration Strategy

### Development Workflow

1. Create a new migration file in `api/migrations/` (directory to be created as needed).
2. Write both `up` (apply) and `down` (rollback) functions.
3. Test the migration locally using Docker Compose.
4. Commit the migration file to version control.
5. The CI/CD pipeline will automatically run migrations on deployment.

### Migration Naming Convention

Use timestamps for ordering:

```
YYYYMMDDHHMMSS_description.js
```

Example:
```
20240101120000_create_users_table.js
20240102130000_add_email_to_users.js
```

## Running Migrations

### Local Development

```bash
./scripts/run_migrations.sh local
```

Or directly:

```bash
cd api
npm run migrate
```

### CI/CD Pipeline

Migrations run automatically during the `run-migrations` job in the GitHub Actions workflow, before deployment to staging.

### Manual Execution (Staging/Production)

```bash
export DATABASE_URL="postgresql://user:pass@host:5432/db"
cd api
npm run migrate
```

## Migration Best Practices

1. **Make migrations idempotent** – Running the same migration multiple times should not cause errors.
2. **Test migrations on staging first** – Never deploy untested migrations to production.
3. **Keep migrations small and focused** – One change per migration file.
4. **Avoid data transformations in schema migrations** – Use separate data migration scripts.
5. **Always provide a rollback path** – Ensure `down` migrations can reverse changes.
6. **Backup before major changes** – Take database snapshots before applying destructive migrations.

## Migration Tools

The current implementation is a placeholder. Consider integrating one of these tools:

### Option 1: node-pg-migrate

```bash
npm install node-pg-migrate
```

Example migration:
```javascript
exports.up = (pgm) => {
  pgm.createTable('users', {
    id: 'id',
    email: { type: 'varchar(255)', notNull: true, unique: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('users');
};
```

### Option 2: Knex.js

```bash
npm install knex
```

Create migrations:
```bash
npx knex migrate:make create_users_table
```

### Option 3: TypeORM

```bash
npm install typeorm
```

Generate migrations:
```bash
npx typeorm migration:generate -n CreateUsersTable
```

### Option 4: Prisma

```bash
npm install prisma
```

Apply migrations:
```bash
npx prisma migrate dev
npx prisma migrate deploy
```

## Rollback Procedures

### Rolling Back the Last Migration

If a migration causes issues:

1. Identify the problematic migration.
2. Create a compensating migration that reverses the changes.
3. Test thoroughly in a staging environment.
4. Deploy the compensating migration.

### Manual Rollback (if supported by migration tool)

```bash
cd api
npm run migrate:rollback
```

### Emergency Rollback

1. Restore database from backup.
2. Re-run migrations up to the last known good state.
3. Redeploy the application version that matches the database schema.

## CI/CD Integration

The migration step in `.github/workflows/ci-cd.yml`:

```yaml
run-migrations:
  name: Run Database Migrations
  runs-on: ubuntu-latest
  needs: [build-api]
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  environment:
    name: staging
  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'

    - name: Install dependencies
      working-directory: ./api
      run: npm ci

    - name: Run migrations
      working-directory: ./api
      env:
        DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
      run: npm run migrate
```

Migrations run before deployment to ensure the database schema is up-to-date before new application code is deployed.

## Monitoring and Verification

After running migrations:

1. Check application logs for migration success/failure.
2. Verify schema changes using:
   ```bash
   psql $DATABASE_URL -c "\dt"  # List tables
   psql $DATABASE_URL -c "\d table_name"  # Describe table
   ```
3. Run smoke tests to confirm application functionality.
4. Monitor error rates and database performance metrics.

## Troubleshooting

### Migration Fails

- Check database connectivity and credentials.
- Review migration logs for SQL errors.
- Ensure the database user has sufficient permissions (CREATE, ALTER, DROP).

### Migration Timeout

- Increase timeout in CI/CD workflow.
- Optimize long-running migrations (e.g., add indexes concurrently in PostgreSQL).
- Consider running large migrations outside the deployment window.

### Schema Conflicts

- Ensure all developers pull latest migrations before creating new ones.
- Use a migration lock mechanism to prevent concurrent migrations.
- Resolve conflicts by creating a new migration that reconciles differences.
