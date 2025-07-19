# Riderz Server

Node.js + Express backend with Socket.io for real-time ride tracking.

## Features

- REST API for maps and rides management
- Socket.io for real-time location sharing
- PostgreSQL database with JSONB support
- Session-based authentication
- Swagger API documentation
- CORS support for web/mobile clients

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 12+

### Installation
```bash
npm install
```

### Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=riderz
DB_USER=postgres
DB_PASSWORD=your_password
SESSION_SECRET=your-secret-key
ORGANIZER_PASSWORD=admin123
```

### Database Setup
```bash
npm run db:setup
```

This creates:
- `maps` table for route definitions
- `rides` table for active/ended rides
- Sample map data for testing

## Development

### Start Development Server
```bash
npm run dev
```

Server runs on http://localhost:3001

### API Documentation
Interactive docs: http://localhost:3001/api-docs

### API Endpoints

#### Authentication
- `POST /api/auth/organizer` - Login with password
- `POST /api/auth/logout` - Clear session
- `GET /api/auth/status` - Check login status

#### Maps (Organizers only)
- `GET /api/maps` - List all maps
- `POST /api/maps` - Create new map
- `PUT /api/maps/:id` - Update map
- `DELETE /api/maps/:id` - Delete map

#### Rides
- `POST /api/rides` - Start ride (organizer)
- `POST /api/rides/join` - Join with PIN (rider)
- `GET /api/rides/:id` - Get ride details
- `POST /api/rides/:id/end` - End ride (organizer)

### Socket.io Events

#### Client to Server
- `join-ride` - Join ride room
- `location-update` - Send GPS coordinates
- `end-ride` - End ride (organizer)

#### Server to Client
- `user-snapshot` - Initial active users
- `location-broadcast` - User location update
- `user-joined` - New user notification
- `user-left` - User disconnect notification
- `ride-ended` - Ride termination
- `error` - Error messages

## Database Schema

### Maps Table
```sql
CREATE TABLE maps (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  notes TEXT,
  waypoints JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Rides Table
```sql
CREATE TABLE rides (
  id SERIAL PRIMARY KEY,
  map_id INTEGER REFERENCES maps(id),
  pin_code TEXT UNIQUE NOT NULL,
  status TEXT CHECK(status IN ('active', 'ended')) DEFAULT 'active',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);
```

## Architecture

- **Express.js**: REST API framework
- **Socket.io**: Real-time communication
- **PostgreSQL**: Primary database
- **In-Memory Cache**: Active user locations
- **Session Store**: Organizer authentication

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure session secret
4. Enable HTTPS
5. Configure CORS origins
6. Set up process manager (PM2)

```bash
npm start
```

## Security Features

- Session-based authentication
- CORS protection
- Input validation
- SQL injection prevention
- Environment variable secrets