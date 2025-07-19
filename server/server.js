const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const mapsRoutes = require('./routes/maps');
const { router: ridesRoutes, activeUsers, updateUserLocation } = require('./routes/rides');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-super-secret-session-key';

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Riderz API',
      version: '1.0.0',
      description: 'Real-time ride sharing app API',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

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
    
    // Send current user snapshot to the new user
    const users = activeUsers.get(parseInt(rideId)) || new Map();
    const userSnapshot = {};
    users.forEach((userData, uid) => {
      userSnapshot[uid] = userData;
    });
    
    socket.emit('user-snapshot', userSnapshot);
    
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
    
    // Update user location in memory
    const success = updateUserLocation(parseInt(rideId), userId, lat, lng);
    
    if (!success) {
      socket.emit('error', { message: 'Failed to update location' });
      return;
    }
    
    // Broadcast location to all users in the ride
    socket.to(`ride-${rideId}`).emit('location-broadcast', {
      userId,
      lat,
      lng,
      role,
      timestamp: Date.now()
    });
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
});