const express = require('express');
const { query } = require('../db/database');
const { requireAuth, generatePinCode, generateUserId } = require('../middleware/auth');
const router = express.Router();

// In-memory store for active users (in production, use Redis)
const activeUsers = new Map(); // rideId -> Map(userId -> userData)

/**
 * @swagger
 * /api/rides:
 *   post:
 *     summary: Start a new ride (organizer only)
 *     tags: [Rides]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mapId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Ride started successfully
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { mapId } = req.body;
    
    if (!mapId) {
      return res.status(400).json({ error: 'Map ID is required' });
    }
    
    // Verify map exists
    const mapResult = await query('SELECT id FROM maps WHERE id = $1', [mapId]);
    if (mapResult.rows.length === 0) {
      return res.status(404).json({ error: 'Map not found' });
    }
    
    // Generate unique rider PIN
    let riderPin;
    let riderPinExists = true;
    while (riderPinExists) {
      riderPin = generatePinCode();
      const existingPin = await query(
        'SELECT id FROM rides WHERE rider_pin = $1 AND status = $2',
        [riderPin, 'active']
      );
      riderPinExists = existingPin.rows.length > 0;
    }
    
    // Generate unique organizer PIN
    let organizerPin;
    let organizerPinExists = true;
    while (organizerPinExists) {
      organizerPin = generatePinCode();
      const existingPin = await query(
        'SELECT id FROM rides WHERE organizer_pin = $1 AND status = $2',
        [organizerPin, 'active']
      );
      organizerPinExists = existingPin.rows.length > 0;
    }
    
    // Create ride
    const result = await query(
      'INSERT INTO rides (map_id, rider_pin, organizer_pin) VALUES ($1, $2, $3) RETURNING id, map_id, rider_pin, organizer_pin, status, started_at',
      [mapId, riderPin, organizerPin]
    );
    
    const ride = result.rows[0];
    
    // Initialize active users for this ride
    activeUsers.set(ride.id, new Map());
    
    // Add organizer to active users
    const organizerUserId = req.session.userId;
    const organizerData = {
      role: 'organizer',
      lat: null,
      lng: null,
      lastSeen: new Date().toISOString(),
      connectedAt: new Date().toISOString()
    };
    
    activeUsers.get(ride.id).set(organizerUserId, organizerData);
    
    res.status(201).json({
      ...ride,
      userId: organizerUserId
    });
  } catch (error) {
    console.error('Error starting ride:', error);
    res.status(500).json({ error: 'Failed to start ride' });
  }
});

/**
 * @swagger
 * /api/rides/join:
 *   post:
 *     summary: Join a ride with PIN code
 *     tags: [Rides]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pinCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully joined ride
 *       404:
 *         description: Invalid PIN or ride not found
 */
router.post('/join', async (req, res) => {
  try {
    const { pinCode } = req.body;
    
    if (!pinCode) {
      return res.status(400).json({ error: 'PIN code is required' });
    }
    
    // Find active ride with PIN (check both rider and organizer PINs)
    const result = await query(
      'SELECT r.id, r.map_id, r.rider_pin, r.organizer_pin, r.status, r.started_at, m.title, m.notes, m.waypoints, m.route_coordinates FROM rides r JOIN maps m ON r.map_id = m.id WHERE (r.rider_pin = $1 OR r.organizer_pin = $1) AND r.status = $2',
      [pinCode, 'active']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid PIN code or ride not active' });
    }
    
    const ride = result.rows[0];
    
    // Determine role based on which PIN was used
    const role = pinCode === ride.organizer_pin ? 'organizer' : 'rider';
    
    // Generate user ID
    const userId = generateUserId();
    
    // Initialize active users map if not exists
    if (!activeUsers.has(ride.id)) {
      activeUsers.set(ride.id, new Map());
    }
    
    // Add user to active users
    const userData = {
      role: role,
      lat: null,
      lng: null,
      lastSeen: new Date().toISOString(),
      connectedAt: new Date().toISOString()
    };
    
    activeUsers.get(ride.id).set(userId, userData);
    
    res.json({
      ...ride,
      userId
    });
  } catch (error) {
    console.error('Error joining ride:', error);
    res.status(500).json({ error: 'Failed to join ride' });
  }
});

/**
 * @swagger
 * /api/rides:
 *   get:
 *     summary: Get all active rides (organizer only)
 *     tags: [Rides]
 *     responses:
 *       200:
 *         description: List of active rides
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT r.id, r.map_id, r.rider_pin, r.organizer_pin, r.status, r.started_at, m.title, m.notes FROM rides r JOIN maps m ON r.map_id = m.id WHERE r.status = $1 ORDER BY r.started_at DESC',
      ['active']
    );
    
    const ridesWithUsers = result.rows.map(ride => {
      const users = activeUsers.get(ride.id) || new Map();
      const activeUserCount = users.size;
      
      return {
        ...ride,
        activeUserCount
      };
    });
    
    res.json(ridesWithUsers);
  } catch (error) {
    console.error('Error fetching active rides:', error);
    res.status(500).json({ error: 'Failed to fetch active rides' });
  }
});

/**
 * @swagger
 * /api/rides/{id}:
 *   get:
 *     summary: Get ride details and active users
 *     tags: [Rides]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ride details with active users
 *       404:
 *         description: Ride not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT r.id, r.map_id, r.rider_pin, r.organizer_pin, r.status, r.started_at, r.ended_at, m.title, m.notes, m.waypoints, m.route_coordinates FROM rides r JOIN maps m ON r.map_id = m.id WHERE r.id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found' });
    }
    
    const ride = result.rows[0];
    
    // Get active users for this ride
    const users = activeUsers.get(parseInt(id)) || new Map();
    const activeUserList = Array.from(users.entries()).map(([userId, userData]) => ({
      userId,
      ...userData
    }));
    
    res.json({
      ...ride,
      activeUsers: activeUserList
    });
  } catch (error) {
    console.error('Error fetching ride:', error);
    res.status(500).json({ error: 'Failed to fetch ride' });
  }
});

/**
 * @swagger
 * /api/rides/{id}/end:
 *   post:
 *     summary: End a ride (organizer only)
 *     tags: [Rides]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ride ended successfully
 *       404:
 *         description: Ride not found
 */
router.post('/:id/end', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'UPDATE rides SET status = $1, ended_at = CURRENT_TIMESTAMP WHERE id = $2 AND status = $3 RETURNING id, status, ended_at',
      ['ended', id, 'active']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found or already ended' });
    }
    
    // Clear active users for this ride
    activeUsers.delete(parseInt(id));
    
    res.json({
      message: 'Ride ended successfully',
      ride: result.rows[0]
    });
  } catch (error) {
    console.error('Error ending ride:', error);
    res.status(500).json({ error: 'Failed to end ride' });
  }
});

// Helper function to update user location
const updateUserLocation = (rideId, userId, lat, lng, role = null) => {
  if (!activeUsers.has(rideId)) {
    return false;
  }
  
  const users = activeUsers.get(rideId);
  if (!users.has(userId)) {
    return false;
  }
  
  const userData = users.get(userId);
  userData.lat = lat;
  userData.lng = lng;
  userData.lastSeen = new Date().toISOString();
  
  // Update role if provided
  if (role) {
    userData.role = role;
  }
  
  return true;
};

// Helper function to remove inactive users
const cleanupInactiveUsers = () => {
  const cutoff = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago
  
  activeUsers.forEach((users, rideId) => {
    users.forEach((userData, userId) => {
      if (new Date(userData.lastSeen) < cutoff) {
        users.delete(userId);
      }
    });
  });
};

// Cleanup inactive users every minute
setInterval(cleanupInactiveUsers, 60 * 1000);

module.exports = {
  router,
  activeUsers,
  updateUserLocation
};