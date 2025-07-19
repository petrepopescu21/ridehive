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
- PostgreSQL 12+
- Git

### 1. Database Setup
```bash
# Create PostgreSQL database
createdb ridehive

# Set environment variables
cp server/.env.example server/.env
# Edit server/.env with your database credentials
```

### 2. Server Setup
```bash
cd server
npm install
npm run db:setup  # Creates tables and sample data
npm run dev       # Starts on http://localhost:3001
```

### 3. Web Client Setup
```bash
cd web-client
npm install
npm run dev       # Starts on http://localhost:5173
```

### 4. Mobile Client Setup
```bash
cd mobile-client
npm install
# For React Native development, see mobile-client/README.md
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

### Server
```bash
cd server
npm run build  # If using TypeScript build
npm start
```

### Web Client
```bash
cd web-client
npm run build
# Serve dist/ folder with nginx/apache
```

### Mobile Apps
```bash
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