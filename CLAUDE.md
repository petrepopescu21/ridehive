# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development Setup
```bash
# Start dependencies (PostgreSQL + Redis) and get instructions
npm run dev

# Start individual services (run in separate terminals after npm run dev)
npm run start:server    # Start Node.js server natively on :3001
npm run start:web       # Start Vite dev server natively on :5173

# Or start both together
npx concurrently "npm run start:server" "npm run start:web"
```

### Dependency Management
```bash
npm run dev:deps        # Start dependencies only (PostgreSQL + Redis)
npm run dev:deps:stop   # Stop dependencies only
npm run dev:status      # Check environment status
npm run dev:logs        # View dependency logs
npm run dev:reset-db    # Reset database (use -- --force for confirmation)
```

### Build & Quality
```bash
npm run build           # Build all projects (server + web)
npm run lint            # Lint server and web client
npm run test            # Run tests for all projects (currently minimal)

# Individual project commands
npm run build:server    # Build server (if TypeScript build exists)
npm run build:web       # Build web client for production
npm run lint:server     # Lint server code
npm run lint:web        # Lint web client code
```

### Mobile Development
```bash
cd mobile-client
npm run android         # Run on Android device/emulator
npm run ios             # Run on iOS device/simulator
npm run start           # Start Metro bundler
```

## Architecture Overview

**Monorepo Structure** with npm workspaces:
- `server/` - Node.js + Express + Socket.io backend
- `web-client/` - React + Vite + TypeScript (organizer dashboard)
- `mobile-client/` - React Native + TypeScript (rider app)
- `shared/` - Shared TypeScript types and constants

### Key Technologies
- **Real-time**: Socket.io for live location sharing and user presence
- **Database**: PostgreSQL with JSONB for waypoint storage, Redis for real-time user cache
- **Frontend**: React 18+ with TypeScript, Tailwind CSS via CDN
- **Maps**: Leaflet.js with OpenStreetMap (no API keys required)
- **Mobile**: React Native with native maps and geolocation

### Core Data Flow
1. **Organizers** create maps with waypoints via web client
2. **Rides** are started from maps, generating 6-digit PIN codes
3. **Riders** join via mobile app using PIN codes
4. **Real-time location** sharing via Socket.io rooms
5. **Live updates** broadcast to all participants in ride

## Development Workflow

### Native Development (Recommended)
1. `npm run dev` - Starts PostgreSQL + Redis in Docker, shows next steps
2. `npm run start:server` - Start Node.js server natively (:3001)
3. `npm run start:web` - Start Vite dev server natively (:5173)

### Key Endpoints
- Web Client: http://localhost:5173 (login: password `admin123`)
- Server API: http://localhost:3001
- API Docs: http://localhost:3001/api-docs (Swagger)
- PostgreSQL: localhost:5432 (Docker)
- Redis: localhost:6379 (Docker)

### Database Schema
- `maps` - Route definitions with JSONB waypoints array
- `rides` - Active/ended rides with PIN codes and metadata
- `active_users` - Redis hash for real-time user locations and status

### Socket.io Events (shared/constants.ts)
- `join-ride` - Connect to ride room
- `location-update` - Send GPS coordinates  
- `location-broadcast` - Receive others' locations
- `user-joined/left` - User presence changes
- `ride-ended` - Organizer ends ride

## Code Conventions

### Project Structure
- Shared constants and types in `shared/constants.ts`
- API endpoints defined in `shared/constants.ts` ENDPOINTS object
- Socket events defined in `shared/constants.ts` SOCKET_EVENTS object

### Authentication
- **Organizers**: Session-based auth with password (`ORGANIZER_PASSWORD` env var)
- **Riders**: Temporary user IDs, no persistent authentication
- Auth status endpoints: `/api/auth/status`, `/api/auth/logout`

### Environment Variables (server/.env)
- `PORT` - Server port (default: 3001)
- `DB_*` - PostgreSQL connection settings
- `SESSION_SECRET` - Express session secret
- `ORGANIZER_PASSWORD` - Web login password

### Development Notes
- Real-time location updates every 5 seconds (`LOCATION_UPDATE_INTERVAL`)
- Automatic cleanup of inactive users after 2 minutes (`INACTIVE_USER_THRESHOLD`)
- Use Docker only for dependencies (PostgreSQL + Redis), not for Node.js apps
- Cross-platform npm scripts work on Windows, macOS, and Linux

### Quality Assurance
Always run linting before committing:
```bash
npm run lint    # Lint all projects
```

Web client uses ESLint with React TypeScript configuration. Server currently has minimal linting setup.