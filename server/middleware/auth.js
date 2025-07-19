require('dotenv').config();

const ORGANIZER_PASSWORD = process.env.ORGANIZER_PASSWORD || 'admin123';

// Middleware to check if user is authenticated as organizer
const requireAuth = (req, res, next) => {
  if (req.session && req.session.isOrganizer) {
    return next();
  }
  
  return res.status(401).json({ 
    error: 'Authentication required. Please login as organizer.' 
  });
};

// Generate random PIN code for rides
const generatePinCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate temporary user ID
const generateUserId = () => {
  return require('crypto').randomUUID();
};

module.exports = {
  requireAuth,
  generatePinCode,
  generateUserId,
  ORGANIZER_PASSWORD
};