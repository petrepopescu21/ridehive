# RideHive - Real-Time Ride Sharing App

A full-stack application for organizing group rides with live location tracking.

## Features

- **Organizer Web Dashboard**: Create maps, manage rides, monitor participants
- **Mobile Apps**: iOS/Android apps for riders to join and share location
- **Real-time Location**: Live location sharing via Socket.io
- **Interactive Maps**: Leaflet.js with OpenStreetMap tiles (no API keys required)
- **PIN-based Joining**: Simple 6-digit codes to join rides
- **PostgreSQL Database**: Robust data storage with JSONB for waypoints

## Architecture

```
ridehive/
├── server/           # Node.js + Express + Socket.io backend
├── web-client/       # React + Vite + TypeScript (organizers)
├── mobile-client/    # React Native (riders)
└── shared/          # Shared types and constants
```

## Quick Start

### Prerequisites
- Node.js 18+
- Docker Desktop (for containerized development)
- Git

**For Windows users**: All commands work cross-platform using npm scripts.

### Native Node.js Development (Recommended)
```bash
# 1. Start dependencies (PostgreSQL + Redis in Docker)
npm run dev

# 2. In separate terminals, start applications natively:
npm run start:server   # Start Node.js server natively
npm run start:web      # Start Vite dev server natively

# Or start both together:
npx concurrently "npm run start:server" "npm run start:web"

# Dependency management
npm run dev:deps       # Start dependencies only
npm run dev:deps:stop  # Stop dependencies only
npm run dev:logs       # View dependency logs
npm run dev:status     # Check status
```

**Services will be available at:**
- 🌐 Web Client: http://localhost:5173 (Vite dev server)
- 🚀 Server API: http://localhost:3001  
- 📚 API Docs: http://localhost:3001/api-docs
- 🗄️ PostgreSQL: localhost:5432 (Docker)
- 🔴 Redis: localhost:6379 (Docker)

### Manual Setup (Alternative)
```bash
# 1. Database Setup
createdb ridehive
cp server/.env.example server/.env

# 2. Server
cd server && npm install && npm run db:setup && npm run dev

# 3. Web Client  
cd web-client && npm install && npm run dev

# 4. Mobile Client
cd mobile-client && npm install
```

## Usage

### For Organizers (Web)
1. Login at http://localhost:5173 (password: admin123)
2. Create maps by clicking waypoints
3. Start rides to get PIN codes
4. Monitor participants in real-time

### For Riders (Mobile)
1. Open mobile app
2. Enter PIN code from organizer
3. Allow location permissions
4. View route and other participants

## API Documentation

Interactive API docs available at: http://localhost:3001/api-docs

## Development

### Development Scripts (Cross-Platform)

All development tasks use npm scripts that work on Windows, macOS, and Linux:

```bash
# Native Node.js Development
npm run dev                # Start dependencies, then start apps manually
npm run start:server       # Start Node.js server natively  
npm run start:web          # Start Vite dev server natively

# Dependency Management (Docker)
npm run dev:deps           # Start dependencies (PostgreSQL + Redis)
npm run dev:deps:stop      # Stop dependencies only
npm run dev:stop           # Stop everything (apps + dependencies)
npm run dev:restart        # Restart development environment

# Monitoring and debugging
npm run dev:logs           # View dependency logs
npm run dev:status         # Check environment status
npm run dev:shell:postgres # Open shell in postgres container
npm run dev:shell:redis    # Open shell in redis container

# Maintenance
npm run dev:reset-db       # Reset database (use -- --force)
npm run dev:test           # Run tests

# Production (Docker)
npm run docker:up:prod     # Start production containers
npm run docker:down:prod   # Stop production containers

# Help
npm run help               # Show all available commands
```

**Development Workflow:**
1. `npm run dev` - Start dependencies and see instructions
2. `npm run start:server` (in new terminal) - Start server natively
3. `npm run start:web` (in new terminal) - Start web client natively

**Windows PowerShell/CMD users**: All commands work identically.

### Environment Variables
- `PORT`: Server port (default: 3001)
- `DB_*`: PostgreSQL connection settings
- `SESSION_SECRET`: Express session secret
- `ORGANIZER_PASSWORD`: Web login password

### Database Schema
- `maps`: Route definitions with JSONB waypoints
- `rides`: Active/ended rides with PIN codes
- `active_users`: Redis cache for real-time user data

### Real-time Events
- `join-ride`: Connect to ride room
- `location-update`: Send GPS coordinates
- `location-broadcast`: Receive others' locations
- `user-joined/left`: User status changes
- `ride-ended`: Organizer ends ride

## Project Structure

### Server (`server/`)
- Express.js REST API
- Socket.io for real-time communication
- PostgreSQL with pg driver
- Session-based authentication
- Swagger documentation

### Web Client (`web-client/`)
- React 18 + TypeScript
- Vite for fast development
- Tailwind CSS via CDN
- Leaflet.js for maps
- Axios for API calls

### Mobile Client (`mobile-client/`)
- React Native with TypeScript
- React Native Maps
- Geolocation services
- Socket.io client
- Native navigation

### Shared (`shared/`)
- TypeScript interfaces
- API constants
- Socket event definitions

## Deployment

### Production with Docker (Recommended)
```bash
# Use production Docker Compose
npm run docker:up:prod

# Or manually:
docker-compose up -d
```

### Manual Production Setup
```bash
# Server
cd server
npm run build  # If using TypeScript build
npm start

# Web Client  
cd web-client
npm run build
# Serve dist/ folder with nginx/apache

# Mobile Apps
cd mobile-client
# iOS
npx react-native run-ios
# Android  
npx react-native run-android
```

## Security

- Session-based authentication for organizers
- Temporary user IDs for riders
- CORS protection
- Input validation on all endpoints
- Environment variable configuration

## Performance

- Real-time location updates every 5 seconds
- Automatic cleanup of inactive users
- Efficient PostgreSQL queries with indexes
- Lightweight React Native components

## License

MIT License - see LICENSE file for details