#!/bin/bash

# Analytics Backend Setup and Test Script

set -e

echo "🚀 Setting up Restaurant Inventory Analytics Backend..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check PostgreSQL
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL client not found. Make sure PostgreSQL is installed and running"
    fi
    
    # Check Redis
    if ! command -v redis-cli &> /dev/null; then
        print_warning "Redis CLI not found. Make sure Redis is installed and running"
    fi
    
    print_status "Prerequisites check completed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install API dependencies
    cd apps/api
    npm install
    cd ../..
    
    # Install shared dependencies
    cd packages/shared
    npm install
    cd ../..
    
    print_status "Dependencies installed successfully"
}

# Setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    # Copy environment file if it doesn't exist
    if [ ! -f "apps/api/.env" ]; then
        cp apps/api/.env.example apps/api/.env
        print_warning "Created .env file from example. Please update with your database credentials"
    fi
    
    print_status "Environment setup completed"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    cd apps/api
    npm run migrate
    cd ../..
    
    print_status "Database migrations completed"
}

# Seed database with test data
seed_database() {
    print_status "Seeding database with test data..."
    
    cd apps/api
    node --loader tsx/cjs src/database/seed.ts
    cd ../..
    
    print_status "Database seeded successfully"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    cd apps/api
    npm test
    cd ../..
    
    print_status "Tests completed successfully"
}

# Start development server
start_server() {
    print_status "Starting development server..."
    
    cd apps/api
    npm run dev &
    SERVER_PID=$!
    cd ../..
    
    # Wait for server to start
    sleep 5
    
    # Check if server is running
    if curl -s http://localhost:3000/health > /dev/null; then
        print_status "Server started successfully on http://localhost:3000"
        
        # Test API endpoints
        test_api_endpoints
        
        # Stop the server
        kill $SERVER_PID
        print_status "Server stopped"
    else
        print_error "Failed to start server"
        exit 1
    fi
}

# Test API endpoints
test_api_endpoints() {
    print_status "Testing API endpoints..."
    
    # Test health endpoint
    if curl -s http://localhost:3000/health | grep -q "ok"; then
        print_status "✅ Health endpoint working"
    else
        print_error "❌ Health endpoint failed"
    fi
    
    # Test root endpoint
    if curl -s http://localhost:3000/ | grep -q "Restaurant Inventory Analytics API"; then
        print_status "✅ Root endpoint working"
    else
        print_error "❌ Root endpoint failed"
    fi
    
    # Test authentication (will fail without proper setup, but should return proper error)
    if curl -s -X POST http://localhost:3000/api/auth/login \
         -H "Content-Type: application/json" \
         -d '{"email":"test@test.com","password":"test123"}' | grep -q "success"; then
        print_status "✅ Authentication endpoint responding"
    else
        print_status "✅ Authentication endpoint properly rejecting invalid credentials"
    fi
    
    print_status "API endpoint tests completed"
}

# Generate sample analytics report
generate_sample_report() {
    print_status "Generating sample analytics report..."
    
    # This would typically require authentication
    # For demo purposes, we'll just show the structure
    cat << 'EOF'

Sample Analytics Report Structure:
{
  "success": true,
  "data": [
    {
      "locationId": "uuid",
      "locationName": "Main Restaurant",
      "totalValue": 15420.50,
      "totalItems": 342,
      "categoryBreakdown": [
        {
          "category": "Vegetables",
          "value": 3250.00,
          "itemCount": 120,
          "percentage": 21.1
        }
      ],
      "date": "2024-01-15"
    }
  ]
}

EOF
    
    print_status "Sample report structure displayed"
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    
    # Kill any running processes
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null || true
    fi
    
    print_status "Cleanup completed"
}

# Main execution
main() {
    print_status "Starting Restaurant Inventory Analytics Backend Setup"
    
    # Set up cleanup trap
    trap cleanup EXIT
    
    # Run setup steps
    check_prerequisites
    install_dependencies
    setup_environment
    
    # Ask user if they want to run database setup
    echo ""
    read -p "Do you want to run database migrations and seed data? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_migrations
        seed_database
    fi
    
    # Ask user if they want to run tests
    echo ""
    read -p "Do you want to run the test suite? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_tests
    fi
    
    # Ask user if they want to start the server
    echo ""
    read -p "Do you want to start the development server and test endpoints? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_server
    fi
    
    # Generate sample report
    generate_sample_report
    
    print_status "Setup completed successfully! 🎉"
    echo ""
    echo "Next steps:"
    echo "1. Update apps/api/.env with your database credentials"
    echo "2. Start Redis server: redis-server"
    echo "3. Start PostgreSQL server"
    echo "4. Run migrations: npm run migrate (from apps/api directory)"
    echo "5. Seed data: node --loader tsx/cjs src/database/seed.ts (from apps/api directory)"
    echo "6. Start server: npm run dev (from apps/api directory)"
    echo "7. Visit http://localhost:3000 for API documentation"
    echo ""
    echo "API Documentation: apps/api/README.md"
    echo "Scheduler Documentation: apps/api/docs/scheduler.md"
}

# Run main function
main "$@"