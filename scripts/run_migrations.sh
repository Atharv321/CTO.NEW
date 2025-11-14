#!/bin/bash

set -euo pipefail

ENVIRONMENT=${1:-staging}

if [ "$ENVIRONMENT" = "local" ]; then
  docker compose run --rm api npm run migrate
else
  echo "Ensure DATABASE_URL is set via environment variables or secrets."
  (cd api && npm run migrate)
fi
