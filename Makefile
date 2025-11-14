.PHONY: help build test up down clean migrate rollback logs

help:
	@echo "Available commands:"
	@echo "  make build         - Build Docker images locally"
	@echo "  make test          - Run tests for both API and Web"
	@echo "  make up            - Start development environment"
	@echo "  make down          - Stop development environment"
	@echo "  make clean         - Clean up containers and volumes"
	@echo "  make migrate       - Run database migrations"
	@echo "  make rollback      - Rollback staging deployment"
	@echo "  make logs          - View logs from all services"
	@echo "  make api-logs      - View API logs"
	@echo "  make web-logs      - View Web logs"
	@echo "  make install       - Install dependencies"

build:
	@echo "Building Docker images..."
	docker compose build

test:
	@echo "Running API tests..."
	cd api && npm test
	@echo "Running Web tests..."
	cd web && npm test

up:
	@echo "Starting development environment..."
	docker compose up -d
	@echo "Services started. Access:"
	@echo "  Web: http://localhost:3000"
	@echo "  API: http://localhost:3001/health"

down:
	@echo "Stopping development environment..."
	docker compose down

clean:
	@echo "Cleaning up containers, images, and volumes..."
	docker compose down -v --remove-orphans

migrate:
	@echo "Running migrations..."
	./scripts/run_migrations.sh local

rollback:
	@echo "Rolling back staging deployment..."
	./scripts/rollback.sh staging

logs:
	docker compose logs -f

api-logs:
	docker compose logs -f api

web-logs:
	docker compose logs -f web

install:
	@echo "Installing API dependencies..."
	cd api && npm install
	@echo "Installing Web dependencies..."
	cd web && npm install
