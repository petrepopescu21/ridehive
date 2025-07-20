# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development Setup

#### 🚀 Full Development Environment (Recommended)
```bash
# Start everything: dependencies + server + web + mobile (Android)
npm run dev:full

# Or for iOS (macOS only)
npm run dev:full:ios
```

#### 📦 Individual Services
```bash
# Start dependencies (PostgreSQL + Redis) and get instructions
npm run dev

# Start individual services (run in separate terminals after npm run dev)
npm run start:server    # Start Node.js server natively on :3001
npm run start:web       # Start Vite dev server natively on :5173
npm run start:mobile    # Start Expo dev server
npm run android         # Start Android emulator
npm run ios             # Start iOS simulator

# Or start server + web together
npx concurrently "npm run start:server" "npm run start:web"
```

### Dependency Management
```bash
npm run dev:deps        # Start dependencies only (PostgreSQL + Redis)
npm run dev:deps:stop   # Stop dependencies only
npm run dev:status      # Check environment status
npm run dev:logs        # View dependency logs
npm run dev:reset-db    # Reset database (use -- --force for confirmation)
npm run dev:cleanup     # Fix broken PowerShell console after Ctrl+C
```

### Build & Quality
```bash
npm run build           # Build web client for production
npm run lint            # Lint server and web client
npm run test            # Run tests for all projects (currently minimal)

# Production deployment
npm run start           # Start production server (serves both API and web)
npm run build:web       # Build web client only
npm run lint:server     # Lint server code
npm run lint:web        # Lint web client code
```

### Mobile Development
```bash
cd RideHive
npm run android         # Run on Android device/emulator
npm run ios             # Run on iOS device/simulator
npm run start           # Start Metro bundler with Expo

# Or from root directory
npm run start:mobile    # Start Metro bundler
npm run android         # Run on Android
npm run ios             # Run on iOS
```

## Architecture Overview

**Unified Node.js Application** with npm workspaces:
- `server/` - Node.js + Express + Socket.io backend (serves React app in production)
- `web-client/` - React + Vite + TypeScript (organizer dashboard, served by server)
- `RideHive/` - React Native + Expo + TypeScript (rider app, standalone)
- `shared/` - Shared TypeScript types and constants

**Production**: Single Node.js server serves both API and React frontend
**Development**: Separate dev servers with Vite proxy for hot reload

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

### Unified Development (Recommended)
1. `npm run dev` - Starts PostgreSQL + Redis + Node.js server + React dev server
   - Dependencies: PostgreSQL (:15432) + Redis (:16379) in Docker
   - API Server: Node.js (:3001) with hot reload via nodemon
   - Web Client: Vite dev server (:5173) with proxy to API server
   - All services start automatically with proper sequencing

### Manual Development (Advanced)
1. `npm run dev:deps` - Start only PostgreSQL + Redis in Docker
2. `npm run dev:server` - Start Node.js server (:3001) with hot reload
3. `npm run dev:web` - Start Vite dev server (:5173) with API proxy

### Key Endpoints
- **Development**:
  - Web Client: http://localhost:5173 (login: password `admin123`)
  - Server API: http://localhost:3001
  - API Docs: http://localhost:3001/api-docs (Swagger)
  - PostgreSQL: localhost:15432 (Docker)
  - Redis: localhost:16379 (Docker)
- **Production**:
  - Unified App: http://localhost:3001 (both web client and API)
  - API Docs: http://localhost:3001/api-docs

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

## Production Deployment

RideHive uses automated CI/CD deployment to Heroku via GitHub Actions:

- **Automatic Deployment**: Every push to `main` branch triggers deployment
- **Unified Application**: Single Node.js server serves both API and React web client
- **Database**: PostgreSQL with automatic migrations
- **Monitoring**: Health checks and error reporting

For detailed deployment instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

### Quick Deployment Setup
1. Create Heroku app with PostgreSQL add-on
2. Set GitHub secrets: `HEROKU_API_KEY`, `HEROKU_APP_NAME`, `HEROKU_EMAIL`
3. Push to `main` branch → automatic deployment
4. App available at: `https://your-app-name.herokuapp.com`

## Troubleshooting

### PowerShell Console Issues
If your PowerShell console becomes unresponsive or broken after pressing Ctrl+C:

```bash
npm run dev:cleanup     # Automatic console cleanup script
```

Or manually run:
```powershell
# In a new PowerShell window
powershell -ExecutionPolicy Bypass -File scripts/cleanup-console.ps1
```

**Common symptoms:**
- Console doesn't respond to input
- Cursor missing or blinking incorrectly  
- Colors are wrong
- Prompts don't appear

**Prevention tips:**
- Use `npm run dev:deps:stop` to cleanly stop services
- Avoid force-killing PowerShell windows
- Close development processes before closing terminal