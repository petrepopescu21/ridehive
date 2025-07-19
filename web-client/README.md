# Riderz Web Client

React + TypeScript organizer dashboard for managing rides and maps.

## Features

- **Organizer Authentication**: Password-based login
- **Map Management**: Create/edit routes with Leaflet.js
- **Ride Control**: Start rides and monitor participants
- **Real-time Tracking**: Live location updates via Socket.io
- **Responsive Design**: Tailwind CSS styling
- **No API Keys**: Uses OpenStreetMap tiles

## Tech Stack

- React 18 + TypeScript
- Vite for fast development
- Tailwind CSS via CDN
- Leaflet.js for maps
- Socket.io for real-time features
- Axios for API calls

## Setup

### Prerequisites
- Node.js 18+
- Running Riderz server

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

Access at http://localhost:5173

## Usage

### Login
- Default password: `admin123`
- Configurable via server environment

### Dashboard
- View all created maps
- Start rides from existing maps
- Monitor active rides

### Map Editor
- Click map to add waypoints
- Drag/reorder waypoints in sidebar
- Edit waypoint names inline
- Save maps for future rides

### Active Ride Monitoring
- View real-time participant locations
- See ride route and waypoints
- Monitor connection status
- End rides when complete

## Project Structure

```
src/
├── components/
│   ├── map/
│   │   ├── MapEditor.tsx     # Interactive map creation
│   │   └── RideMap.tsx       # Real-time ride monitoring
│   └── common/
│       └── WaypointList.tsx  # Waypoint management
├── pages/
│   ├── Login.tsx             # Authentication
│   ├── Dashboard.tsx         # Main organizer view
│   ├── MapEditor.tsx         # Map creation/editing
│   └── ActiveRide.tsx        # Live ride monitoring
├── hooks/
│   ├── useAuth.ts           # Authentication state
│   ├── useSocket.ts         # Real-time communication
│   └── useGeolocation.ts    # Browser location API
└── utils/
    └── api.ts               # HTTP client
```

## Key Components

### Authentication (useAuth)
- Session-based login/logout
- Automatic status checking
- Error handling

### Maps (MapEditor)
- Interactive Leaflet map
- Click-to-add waypoints
- Inline editing
- Drag reordering

### Real-time (useSocket)
- Socket.io connection management
- Location broadcasting
- User presence tracking
- Automatic reconnection

### Geolocation (useGeolocation)
- Browser location access
- Permission handling
- Continuous position tracking
- Error management

## API Integration

### Authentication
```typescript
authAPI.login(password)
authAPI.logout()
authAPI.getStatus()
```

### Maps
```typescript
mapsAPI.getAll()
mapsAPI.create(mapData)
mapsAPI.update(id, mapData)
mapsAPI.delete(id)
```

### Rides
```typescript
ridesAPI.start(mapId)
ridesAPI.getById(id)
ridesAPI.end(id)
```

## Socket Events

### Emitted
- `join-ride`: Connect to ride room
- `location-update`: Send organizer position
- `end-ride`: Terminate ride

### Received
- `user-snapshot`: Initial participant list
- `location-broadcast`: Participant location updates
- `user-joined/left`: Presence changes
- `ride-ended`: Ride termination

## Styling

- **Framework**: Tailwind CSS via CDN
- **Design**: Professional dashboard aesthetic
- **Responsive**: Desktop-first approach
- **Maps**: Full-screen with overlays
- **Forms**: Consistent input styling

## Build & Deployment

### Production Build
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

### Deploy
Serve the `dist/` folder with any web server:
- nginx
- Apache
- Netlify
- Vercel
- AWS S3 + CloudFront

## Environment Configuration

The client automatically connects to the server at:
- Development: `http://localhost:3001`
- Production: Configure in `shared/constants.ts`

## Security

- CORS-enabled API requests
- Session cookies for authentication
- No sensitive data in localStorage
- Environment-based configuration