const express = require('express');
const { ORGANIZER_PASSWORD, generateUserId } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * /api/auth/organizer:
 *   post:
 *     summary: Login as organizer
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid password
 */
router.post('/organizer', (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }
  
  if (password !== ORGANIZER_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  // Set session
  req.session.isOrganizer = true;
  req.session.userId = generateUserId();
  
  res.json({ 
    message: 'Login successful',
    userId: req.session.userId
  });
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout and clear session
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout successful' });
  });
});

/**
 * @swagger
 * /api/auth/status:
 *   get:
 *     summary: Check authentication status
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Authentication status
 */
router.get('/status', (req, res) => {
  res.json({
    isAuthenticated: !!(req.session && req.session.isOrganizer),
    userId: req.session?.userId || null
  });
});

module.exports = router;