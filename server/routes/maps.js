const express = require('express');
const { query } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// All map routes require organizer authentication
router.use(requireAuth);

/**
 * @swagger
 * /api/maps:
 *   get:
 *     summary: Get all maps
 *     tags: [Maps]
 *     responses:
 *       200:
 *         description: List of all maps
 */
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, title, notes, waypoints, route_coordinates, created_at, updated_at FROM maps ORDER BY created_at DESC'
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching maps:', error);
    res.status(500).json({ error: 'Failed to fetch maps' });
  }
});

/**
 * @swagger
 * /api/maps/{id}:
 *   get:
 *     summary: Get a specific map
 *     tags: [Maps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Map details
 *       404:
 *         description: Map not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT id, title, notes, waypoints, route_coordinates, created_at, updated_at FROM maps WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Map not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching map:', error);
    res.status(500).json({ error: 'Failed to fetch map' });
  }
});

/**
 * @swagger
 * /api/maps:
 *   post:
 *     summary: Create a new map
 *     tags: [Maps]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               notes:
 *                 type: string
 *               waypoints:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     lat:
 *                       type: number
 *                     lng:
 *                       type: number
 *                     name:
 *                       type: string
 *     responses:
 *       201:
 *         description: Map created successfully
 */
router.post('/', async (req, res) => {
  try {
    const { title, notes = '', waypoints = [], route_coordinates = [] } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    if (!Array.isArray(waypoints)) {
      return res.status(400).json({ error: 'Waypoints must be an array' });
    }
    
    if (!Array.isArray(route_coordinates)) {
      return res.status(400).json({ error: 'Route coordinates must be an array' });
    }
    
    const result = await query(
      'INSERT INTO maps (title, notes, waypoints, route_coordinates) VALUES ($1, $2, $3, $4) RETURNING id, title, notes, waypoints, route_coordinates, created_at, updated_at',
      [title, notes, JSON.stringify(waypoints), JSON.stringify(route_coordinates)]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating map:', error);
    res.status(500).json({ error: 'Failed to create map' });
  }
});

/**
 * @swagger
 * /api/maps/{id}:
 *   put:
 *     summary: Update a map
 *     tags: [Maps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               notes:
 *                 type: string
 *               waypoints:
 *                 type: array
 *     responses:
 *       200:
 *         description: Map updated successfully
 *       404:
 *         description: Map not found
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, notes = '', waypoints = [], route_coordinates = [] } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    if (!Array.isArray(waypoints)) {
      return res.status(400).json({ error: 'Waypoints must be an array' });
    }
    
    if (!Array.isArray(route_coordinates)) {
      return res.status(400).json({ error: 'Route coordinates must be an array' });
    }
    
    const result = await query(
      'UPDATE maps SET title = $1, notes = $2, waypoints = $3, route_coordinates = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, title, notes, waypoints, route_coordinates, created_at, updated_at',
      [title, notes, JSON.stringify(waypoints), JSON.stringify(route_coordinates), id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Map not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating map:', error);
    res.status(500).json({ error: 'Failed to update map' });
  }
});

/**
 * @swagger
 * /api/maps/{id}:
 *   delete:
 *     summary: Delete a map
 *     tags: [Maps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Map deleted successfully
 *       404:
 *         description: Map not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM maps WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Map not found' });
    }
    
    res.json({ message: 'Map deleted successfully' });
  } catch (error) {
    console.error('Error deleting map:', error);
    res.status(500).json({ error: 'Failed to delete map' });
  }
});

module.exports = router;