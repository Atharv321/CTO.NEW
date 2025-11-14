#!/bin/bash

set -euo pipefail

ENVIRONMENT=${1:-local}
DETACHED=${2:-true}

echo "🚀 Starting services for environment: $ENVIRONMENT"

if [ "$ENVIRONMENT" = "local" ]; then
  echo "📦 Starting Docker Compose stack..."
  
  # Check if .env file exists
  if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
  fi
  
  if [ "$DETACHED" = "true" ]; then
    docker compose up -d
    echo "✅ Services started in background (detached mode)"
    echo ""
    echo "📝 Service URLs:"
    echo "  Web: http://localhost:3000"
    echo "  API: http://localhost:3001"
    echo "  PostgreSQL: localhost:5432"
    echo "  Redis: localhost:6379"
    echo ""
    echo "💡 View logs with: docker compose logs -f"
    echo "💡 Stop services with: docker compose down"
  else
    docker compose up
  fi
  
elif [ "$ENVIRONMENT" = "staging" ] || [ "$ENVIRONMENT" = "production" ]; then
  echo "❌ Use Helm for deploying to $ENVIRONMENT"
  echo "See docs/deployment.md for instructions"
  exit 1
else
  echo "❌ Unknown environment: $ENVIRONMENT"
  echo "Usage: ./scripts/start-services.sh [local]"
  exit 1
fi
