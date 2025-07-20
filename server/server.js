const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const mapsRoutes = require('./routes/maps');
const { router: ridesRoutes, activeUsers, updateUserLocation } = require('./routes/rides');
const routingRoutes = require('./routes/routing');

const app = express();
const server = http.createServer(app);
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [BASE_URL]
  : ["http://localhost:3000", "http://localhost:5173", "http://localhost:3001"];

// CORS origin function for development
const corsOriginFunction = (origin, callback) => {
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) return callback(null, true);
  
  if (process.env.NODE_ENV === 'production') {
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  } else {
    // In development, allow any localhost origin
    if (origin.startsWith('http://localhost:') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  }
};

const io = socketIo(server, {
  cors: {
    origin: corsOriginFunction,
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-super-secret-session-key';

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RideHive API',
      version: '1.0.0',
      description: 'RideHive - Real-time ride sharing app API',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? BASE_URL
          : `http://localhost:${PORT}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(cors({
  origin: corsOriginFunction,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
const sessionMiddleware = session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});

app.use(sessionMiddleware);

// Share session with Socket.io
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/rides', ridesRoutes);
app.use('/api/routing', routingRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files from React build (production only)
if (process.env.NODE_ENV === 'production') {
  // Serve static assets
  app.use(express.static(path.join(__dirname, '../web-client/dist')));
  
  // Catch-all handler: send back React's index.html file for client-side routing
  app.get('*', (req, res, next) => {
    // Skip API routes and known endpoints
    if (req.path.startsWith('/api') || 
        req.path.startsWith('/health') || 
        req.path.startsWith('/api-docs')) {
      return next();
    }
    
    res.sendFile(path.join(__dirname, '../web-client/dist/index.html'));
  });
}

// Scheduled snapshot broadcasting
const SNAPSHOT_BROADCAST_INTERVAL = 2000; // 2 seconds

const broadcastSnapshots = () => {
  activeUsers.forEach((users, rideId) => {
    if (users.size === 0) return;
    
    const snapshot = {};
    users.forEach((userData, userId) => {
      snapshot[userId] = userData;
    });
    
    console.log(`📡 Broadcasting snapshot for ride ${rideId} to ${users.size} users`);
    io.to(`ride-${rideId}`).emit('user-snapshot', snapshot);
  });
};

// Start the snapshot broadcasting timer
const snapshotTimer = setInterval(broadcastSnapshots, SNAPSHOT_BROADCAST_INTERVAL);

// Socket.io real-time functionality
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join ride room
  socket.on('join-ride', async (data) => {
    const { rideId, userId } = data;
    
    if (!rideId || !userId) {
      socket.emit('error', { message: 'Invalid ride ID or user ID' });
      return;
    }
    
    // Join the ride room
    socket.join(`ride-${rideId}`);
    
    // Store user info on socket
    socket.rideId = rideId;
    socket.userId = userId;
    
    // Ensure the user exists in activeUsers (they might have been added via API)
    if (!activeUsers.has(parseInt(rideId))) {
      activeUsers.set(parseInt(rideId), new Map());
    }
    
    const users = activeUsers.get(parseInt(rideId));
    if (!users.has(userId)) {
      // Add user if they don't exist (fallback)
      users.set(userId, {
        role: 'rider', // Will be updated when they send location
        lat: null,
        lng: null,
        lastSeen: new Date().toISOString(),
        connectedAt: new Date().toISOString()
      });
    } else {
      // Update last seen for existing user
      const userData = users.get(userId);
      userData.lastSeen = new Date().toISOString();
    }
    
    // Note: User snapshot will be sent via scheduled broadcast
    console.log(`✅ User ${userId} added to ride ${rideId}. Next snapshot in ${SNAPSHOT_BROADCAST_INTERVAL}ms`);
    
    // Notify other users that someone joined
    socket.to(`ride-${rideId}`).emit('user-joined', {
      userId,
      timestamp: Date.now()
    });
    
    console.log(`User ${userId} joined ride ${rideId}`);
  });
  
  // Handle location updates
  socket.on('location-update', (data) => {
    const { rideId, userId, lat, lng, role } = data;
    
    if (!rideId || !userId || lat == null || lng == null) {
      socket.emit('error', { message: 'Invalid location data' });
      return;
    }
    
    // Update user location in memory (no immediate broadcast)
    const success = updateUserLocation(parseInt(rideId), userId, lat, lng, role);
    
    if (!success) {
      socket.emit('error', { message: 'Failed to update location' });
      return;
    }
    
    console.log(`📍 Updated location for ${userId} in ride ${rideId}: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    // Note: Location will be broadcast in the next scheduled snapshot
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.rideId && socket.userId) {
      // Notify other users that someone left
      socket.to(`ride-${socket.rideId}`).emit('user-left', {
        userId: socket.userId,
        timestamp: Date.now()
      });
      
      // Remove user from active users
      const users = activeUsers.get(parseInt(socket.rideId));
      if (users) {
        users.delete(socket.userId);
      }
    }
  });
  
  // Handle ride end event (organizer only)
  socket.on('end-ride', (data) => {
    const { rideId } = data;
    
    if (!rideId) {
      socket.emit('error', { message: 'Invalid ride ID' });
      return;
    }
    
    // Notify all users in the ride that it has ended
    io.to(`ride-${rideId}`).emit('ride-ended', {
      rideId,
      timestamp: Date.now()
    });
    
    // Clear active users for this ride
    activeUsers.delete(parseInt(rideId));
    
    console.log(`Ride ${rideId} ended`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
  console.log(`Health check at http://localhost:${PORT}/health`);
  console.log(`📡 Snapshot broadcast interval: ${SNAPSHOT_BROADCAST_INTERVAL}ms`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  clearInterval(snapshotTimer);
  server.close(() => {
    console.log('Server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  clearInterval(snapshotTimer);
  server.close(() => {
    console.log('Server closed');
  });
});