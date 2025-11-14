# Database Migrations

This guide explains how database schema changes are managed with Prisma, how migrations are created and applied, and what tooling is available to keep environments in sync.

## Overview

- **ORM & Schema Toolkit**: [Prisma](https://www.prisma.io/)
- **Schema Definition**: [`api/prisma/schema.prisma`](../api/prisma/schema.prisma)
- **Migration History**: [`api/prisma/migrations`](../api/prisma/migrations)
- **Seed Data**: [`api/prisma/seed.js`](../api/prisma/seed.js)

The first migration creates all core tables (users, roles, locations, inventory, purchasing, alerts, notifications) and installs cross-table auditing triggers. It also populates baseline roles (`admin`, `manager`, `staff`) and sample locations for New York, San Francisco, and London.

## Local Development Workflow

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Update the Prisma schema**
   Modify `api/prisma/schema.prisma` to reflect the desired model changes.

3. **Generate a migration**
   ```bash
   cd api
   npx prisma migrate dev --name add-new-feature
   ```
   - Use `--create-only` if you want Prisma to generate the SQL without executing it.
   - The generated folder in `prisma/migrations` must be committed alongside the schema changes.

4. **Review the SQL**
   Inspect `prisma/migrations/<timestamp>_<name>/migration.sql` to ensure it matches expectations and follows best practices (idempotent, safe defaults, etc.).

5. **Run database seeds (optional)**
   ```bash
   npx prisma db seed
   ```
   This upserts the reference roles and locations defined in `prisma/seed.js`.

## Applying Migrations

### Local Environments

Use the provided migration script, which also runs the seed step by default:

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/appdb"
cd api
npm run migrate
```

Set `SKIP_DB_SEED=true` to bypass the seed step (useful for already-populated databases).

### Continuous Integration / Delivery

The CI/CD pipeline runs `npm run migrate` inside the `api` service before deploying to staging or production. Ensure environment secrets provide the appropriate `DATABASE_URL`.

### Manual Execution (Staging / Production)

```bash
export DATABASE_URL="postgresql://user:password@host:5432/production_db"
cd api
npm ci
npm run migrate
```

## Seed Data Expectations

The seed script performs **idempotent upserts** so it is safe to run multiple times:

- Inserts/updates baseline roles (`admin`, `manager`, `staff`).
- Inserts/updates the representative locations (`NYC-001`, `SFO-001`, `LDN-001`).

You can extend `prisma/seed.js` with additional fixtures (e.g., demo inventory items) while retaining the upsert pattern.

## Auditing and Soft Deletes

- All domain tables include a nullable `deleted_at` column for soft deletes.
- The `log_audit_event` trigger captures every `INSERT`, `UPDATE`, and `DELETE`, writing to the `audit_logs` table.
- Update operations that toggle `deleted_at` are stored as `DELETE` (soft-delete) or `RESTORE` actions.
- If the application sets `SET app.current_user_id = '<uuid>'`, the trigger records the acting user.

Refer to the schema diagram in [`docs/database-schema.md`](./database-schema.md) for the full relationship map and constraint summary (e.g., unique SKUs per location).

## Best Practices

1. **One concern per migration** – Combine related DDL and data updates but avoid unrelated changes in the same migration.
2. **Prefer additive changes** – When possible, add columns/tables before removing old ones to allow for backfills and gradual rollouts.
3. **Keep migrations idempotent** – Avoid `DROP IF EXISTS` on critical objects unless absolutely necessary; use `IF NOT EXISTS` guards where applicable.
4. **Document intent** – Include context in the migration filename (e.g., `20241114121500_initial_schema`).
5. **Run migrations locally** – Always execute migrations against a development database before committing.
6. **Use seeds for reference data** – Rely on `prisma db seed` for deterministic baseline data rather than embedding ad-hoc SQL in migrations.
7. **Monitor audit logs** – Use the `audit_logs` table to diagnose unexpected data changes or soft deletes.

## Troubleshooting

### Migration Fails in CI
- Ensure the migration SQL is compatible with the Postgres version used in CI.
- Check that the `DATABASE_URL` secret is present and the database user has migration privileges (CREATE/ALTER).

### Drift Detected
- Run `npx prisma migrate diff --from-schema-datamodel schema.prisma --to-url "$DATABASE_URL" --script` to inspect differences between the schema and the target database.
- If the production database diverged, create a corrective migration instead of editing historical files.

### Seed Issues
- Seeds are idempotent; retry after fixing any transient errors.
- To seed a different dataset, parameterise `prisma/seed.js` or guard portions of the script with environment variables.

### Rolling Back
- Prisma does not auto-generate down migrations in deploy mode. To revert, create and deploy a compensating migration or restore from a database backup, following the procedures in [`docs/rollback-strategy.md`](./rollback-strategy.md).

## Additional Resources

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma CLI Reference](https://www.prisma.io/docs/reference/api-reference/command-reference)
- [`docs/database-schema.md`](./database-schema.md) for a visual overview of entities and constraints.
