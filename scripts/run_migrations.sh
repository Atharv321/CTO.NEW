#!/bin/bash

set -euo pipefail

ENVIRONMENT=${1:-local}
SKIP_DB_SEED=${SKIP_DB_SEED:-false}

echo "🔄 Running migrations for environment: $ENVIRONMENT"

if [ "$ENVIRONMENT" = "local" ]; then
  echo "📦 Using Docker Compose for local migrations..."
  
  # Ensure containers are running
  docker compose up -d postgres redis
  
  # Wait for PostgreSQL to be ready
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 2
  
  # Run migrations via Docker
  docker compose run --rm api npm run migrate
  
  if [ "$SKIP_DB_SEED" != "true" ]; then
    echo "🌱 Seeding database with sample data..."
    docker compose run --rm api npm run db:seed || echo "⚠️  Seed data script not found, skipping..."
  fi
  
  echo "✅ Local migrations completed successfully!"
  
elif [ "$ENVIRONMENT" = "staging" ] || [ "$ENVIRONMENT" = "production" ]; then
  echo "🚀 Running migrations for remote environment: $ENVIRONMENT"
  
  if [ -z "${DATABASE_URL:-}" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL before running migrations for $ENVIRONMENT"
    exit 1
  fi
  
  # Ensure dependencies are installed
  cd api
  npm ci
  
  # Run migrations
  npm run migrate
  
  echo "✅ Migrations for $ENVIRONMENT completed successfully!"
  cd ..
else
  echo "❌ Unknown environment: $ENVIRONMENT"
  echo "Usage: ./scripts/run_migrations.sh [local|staging|production]"
  exit 1
fi
