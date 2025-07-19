#!/bin/bash

# RideHive Development Helper Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
}

# Start development environment
start_dev() {
    log_info "Starting RideHive development environment..."
    check_docker
    
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
    
    log_success "Development environment started!"
    log_info "Services available at:"
    echo "  🌐 Web Client: http://localhost:3000"
    echo "  🚀 Server API: http://localhost:3001"
    echo "  📚 API Docs: http://localhost:3001/api-docs"
    echo "  🗄️  PostgreSQL: localhost:5432"
    echo "  🔴 Redis: localhost:6379"
    echo ""
    log_info "View logs with: ./scripts/dev.sh logs"
}

# Stop development environment
stop_dev() {
    log_info "Stopping RideHive development environment..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
    log_success "Development environment stopped!"
}

# Restart development environment
restart_dev() {
    log_info "Restarting RideHive development environment..."
    stop_dev
    start_dev
}

# View logs
show_logs() {
    service=${1:-}
    if [ -z "$service" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
    else
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f "$service"
    fi
}

# Clean up everything
clean() {
    log_warning "This will remove all containers, volumes, and images. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        log_info "Cleaning up RideHive development environment..."
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v --rmi all
        docker system prune -f
        log_success "Cleanup complete!"
    else
        log_info "Cleanup cancelled."
    fi
}

# Reset database
reset_db() {
    log_warning "This will reset the database and lose all data. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        log_info "Resetting database..."
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml stop postgres
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml rm -f postgres
        docker volume rm ridehive_postgres_dev_data 2>/dev/null || true
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres
        
        # Wait for database to be ready
        log_info "Waiting for database to be ready..."
        sleep 10
        
        # Restart server to reconnect to fresh database
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml restart server
        
        log_success "Database reset complete!"
    else
        log_info "Database reset cancelled."
    fi
}

# Run tests
run_tests() {
    log_info "Running tests..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec server npm test
}

# Shell into container
shell() {
    service=${1:-server}
    log_info "Opening shell in $service container..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec "$service" /bin/sh
}

# Show status
status() {
    log_info "RideHive Development Environment Status:"
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps
}

# Build images
build() {
    log_info "Building RideHive images..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml build
    log_success "Images built successfully!"
}

# Show help
show_help() {
    echo "RideHive Development Helper Script"
    echo ""
    echo "Usage: ./scripts/dev.sh COMMAND"
    echo ""
    echo "Commands:"
    echo "  start     Start development environment"
    echo "  stop      Stop development environment"
    echo "  restart   Restart development environment"
    echo "  logs      Show logs (optional: specify service name)"
    echo "  status    Show container status"
    echo "  build     Build Docker images"
    echo "  clean     Clean up containers, volumes, and images"
    echo "  reset-db  Reset database (loses all data)"
    echo "  test      Run tests"
    echo "  shell     Open shell in container (default: server)"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./scripts/dev.sh start"
    echo "  ./scripts/dev.sh logs server"
    echo "  ./scripts/dev.sh shell postgres"
}

# Main script logic
case "${1:-}" in
    start)
        start_dev
        ;;
    stop)
        stop_dev
        ;;
    restart)
        restart_dev
        ;;
    logs)
        show_logs "${2:-}"
        ;;
    status)
        status
        ;;
    build)
        build
        ;;
    clean)
        clean
        ;;
    reset-db)
        reset_db
        ;;
    test)
        run_tests
        ;;
    shell)
        shell "${2:-server}"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: ${1:-}"
        echo ""
        show_help
        exit 1
        ;;
esac