# RideHive Docker Development Guide

Complete guide for running RideHive locally using Docker Compose.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 4.0+
- [Git](https://git-scm.com/downloads)
- 8GB+ RAM recommended

## Quick Start

### 1. Clone and Setup
```bash
git clone https://github.com/petrepopescu21/ridehive.git
cd ridehive
```

### 2. Start Development Environment
```bash
# Using helper script (recommended)
./scripts/dev.sh start

# Or using Docker Compose directly
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 3. Access Services
- **🌐 Web Client**: http://localhost:3000 (Organizer Dashboard)
- **🚀 Server API**: http://localhost:3001
- **📚 API Documentation**: http://localhost:3001/api-docs
- **🗄️ PostgreSQL**: localhost:5432
- **🔴 Redis**: localhost:6379

### 4. Login Credentials
- **Organizer Password**: `admin123`

## Development Workflow

### Using Development Helper Script
```bash
# Start all services
./scripts/dev.sh start

# View logs (all services)
./scripts/dev.sh logs

# View logs for specific service
./scripts/dev.sh logs server
./scripts/dev.sh logs web-client

# Check service status
./scripts/dev.sh status

# Restart all services
./scripts/dev.sh restart

# Stop all services
./scripts/dev.sh stop
```

### Hot Reload Development
The development setup includes hot reload for both server and web client:

- **Server**: Uses `nodemon` to restart on file changes
- **Web Client**: Uses Vite's hot module replacement (HMR)
- **Database**: Persistent data across restarts

### File Watching
```bash
# Server files are watched in: ./server/
# Web client files are watched in: ./web-client/
# Changes trigger automatic rebuilds
```

## Service Architecture

### Services Overview
```yaml
┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │     Server      │
│   (React/Vite)  │◄──►│ (Node.js/Express│
│   Port: 3000    │    │   Port: 3001    │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┼─────────┐
                                 ▼         ▼
                      ┌─────────────────┐ ┌─────────────────┐
                      │   PostgreSQL    │ │      Redis      │
                      │   Port: 5432    │ │   Port: 6379    │
                      └─────────────────┘ └─────────────────┘
```

### Environment Variables
Development environment automatically configures:
```bash
# Server Environment
NODE_ENV=development
PORT=3001
DB_HOST=postgres
DB_NAME=ridehive_dev
DB_USER=ridehive
DB_PASSWORD=ridehive123
REDIS_HOST=redis
SESSION_SECRET=dev-secret-change-in-production
ORGANIZER_PASSWORD=admin123

# Web Client Environment
NODE_ENV=development
VITE_API_URL=http://localhost:3001
```

## Database Management

### Connecting to Database
```bash
# Using helper script
./scripts/dev.sh shell postgres

# Then connect to database
psql -U ridehive -d ridehive_dev

# Or using external client
psql -h localhost -p 5432 -U ridehive -d ridehive_dev
```

### Database Operations
```bash
# Reset database (loses all data)
./scripts/dev.sh reset-db

# View database logs
./scripts/dev.sh logs postgres
```

### Sample Data
Development environment includes sample maps:
- Downtown Coffee Tour
- Brooklyn Bridge Ride  
- Central Park Loop

## Debugging

### Container Shell Access
```bash
# Server container
./scripts/dev.sh shell server

# Web client container
./scripts/dev.sh shell web-client

# Database container
./scripts/dev.sh shell postgres
```

### Troubleshooting Common Issues

#### Port Already in Use
```bash
# Check what's using the port
lsof -i :3000  # Web client
lsof -i :3001  # Server
lsof -i :5432  # PostgreSQL

# Stop conflicting services
./scripts/dev.sh stop
```

#### Database Connection Issues
```bash
# Check database health
docker-compose ps postgres

# Reset database
./scripts/dev.sh reset-db

# View database logs
docker-compose logs postgres
```

#### Image Build Issues
```bash
# Rebuild all images
./scripts/dev.sh build

# Clean build (removes everything)
./scripts/dev.sh clean
```

#### Container Memory Issues
```bash
# Check resource usage
docker stats

# Restart with fresh containers
./scripts/dev.sh restart
```

## Testing

### Running Tests
```bash
# Run server tests
./scripts/dev.sh test

# Run tests in specific container
docker-compose exec server npm test
docker-compose exec web-client npm test
```

## Production vs Development

### Development Features
- Hot reload for both server and web client
- Volume mounts for live code editing
- Development database with sample data
- Detailed logging and debugging
- Source maps enabled

### Production Build
```bash
# Build production images
docker-compose build

# Run production environment
docker-compose up -d
```

## CI/CD Integration

### GitHub Actions
Images are automatically built and published:
- **Registry**: GitHub Container Registry (ghcr.io)
- **Images**: 
  - `ghcr.io/petrepopescu21/ridehive-server`
  - `ghcr.io/petrepopescu21/ridehive-web-client`

### Using Pre-built Images
```bash
# Pull latest images
docker pull ghcr.io/petrepopescu21/ridehive-server:main
docker pull ghcr.io/petrepopescu21/ridehive-web-client:main

# Update docker-compose.yml to use remote images
# Change build: context to image: ghcr.io/...
```

## Performance Optimization

### Resource Limits
```yaml
# Recommended Docker Desktop settings
CPU: 4 cores
Memory: 8GB
Swap: 2GB
```

### Volume Performance
```bash
# For better performance on macOS/Windows
# Consider using named volumes for node_modules
volumes:
  - ./server:/app
  - server_node_modules:/app/node_modules
```

## Security Notes

### Development Security
- Uses default development credentials
- Ports exposed for local development
- Debug mode enabled
- CORS configured for localhost

### Production Checklist
- [ ] Change default passwords
- [ ] Use environment variables for secrets
- [ ] Enable SSL/TLS
- [ ] Configure proper CORS origins
- [ ] Use production database
- [ ] Enable logging and monitoring

## Cleanup

### Remove Development Data
```bash
# Stop and remove containers
./scripts/dev.sh stop

# Remove volumes (loses data)
docker-compose down -v

# Complete cleanup (removes images)
./scripts/dev.sh clean
```

## Next Steps

1. **Mobile Development**: Set up React Native development environment
2. **Production Deployment**: Deploy to cloud services
3. **Monitoring**: Add logging and metrics collection
4. **Testing**: Implement comprehensive test suite