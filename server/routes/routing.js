const express = require('express');
const fetch = require('node-fetch');
const polyline = require('@mapbox/polyline');
const router = express.Router();

// OpenRouteService API configuration
const ORS_BASE_URL = 'https://api.openrouteservice.org/v2/directions';
// Note: For production, you should get a free API key from https://openrouteservice.org/dev/#/signup
// For development, we'll try without API key first, then fallback to local calculation
const ORS_API_KEY = process.env.ORS_API_KEY; // Optional API key

/**
 * @swagger
 * /api/routing/calculate:
 *   post:
 *     summary: Calculate route between waypoints
 *     tags: [Routing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
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
 *       200:
 *         description: Route calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 coordinates:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *                 distance:
 *                   type: number
 *                 duration:
 *                   type: number
 *                 method:
 *                   type: string
 *       400:
 *         description: Invalid waypoints
 *       500:
 *         description: Route calculation failed
 */
router.post('/calculate', async (req, res) => {
  try {
    const { waypoints } = req.body;
    
    if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
      return res.status(400).json({ 
        error: 'At least 2 waypoints required',
        coordinates: [],
        method: 'error'
      });
    }

    console.log('🗺️ Calculating route for', waypoints.length, 'waypoints');

    // Try OpenRouteService first
    try {
      const routeData = await calculateWithOpenRouteService(waypoints);
      console.log('✅ Route calculated with OpenRouteService');
      res.json({
        ...routeData,
        method: 'openrouteservice'
      });
      return;
    } catch (orsError) {
      console.warn('⚠️ OpenRouteService failed:', orsError.message);
      
      // Fallback to direct line calculation
      const directRoute = calculateDirectRoute(waypoints);
      console.log('✅ Route calculated with direct lines (fallback)');
      res.json({
        ...directRoute,
        method: 'direct',
        fallback_reason: orsError.message
      });
    }

  } catch (error) {
    console.error('❌ Route calculation error:', error);
    res.status(500).json({ 
      error: 'Route calculation failed',
      coordinates: [],
      method: 'error'
    });
  }
});

/**
 * Calculate route using OpenRouteService API
 */
async function calculateWithOpenRouteService(waypoints) {
  // Convert waypoints to ORS format: [lng, lat]
  const coordinates = waypoints.map(wp => [wp.lng, wp.lat]);
  
  const url = `${ORS_BASE_URL}/driving-car`;
  
  const requestBody = {
    coordinates,
    geometry_simplify: false,
    instructions: false,
    elevation: false
  };

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'RideHive/1.0'
  };

  // Add API key if available
  if (ORS_API_KEY) {
    headers['Authorization'] = `Bearer ${ORS_API_KEY}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('OpenRouteService API key required or invalid');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded');
    }
    const errorText = await response.text();
    throw new Error(`OpenRouteService error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.routes || data.routes.length === 0) {
    throw new Error('No route found');
  }

  const route = data.routes[0];
  
  // OpenRouteService returns geometry as an encoded polyline string
  let routeCoordinates;
  if (typeof route.geometry === 'string') {
    // Decode polyline string
    const decoded = polyline.decode(route.geometry);
    routeCoordinates = decoded.map(([lat, lng]) => ({ lat, lng }));
  } else if (Array.isArray(route.geometry)) {
    // Direct coordinates array (alternative format)
    routeCoordinates = route.geometry.map(([lng, lat]) => ({ lat, lng }));
  } else if (route.geometry && Array.isArray(route.geometry.coordinates)) {
    // GeoJSON format
    routeCoordinates = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
  } else {
    console.error('Unexpected geometry format:', {
      hasGeometry: !!route.geometry,
      geometryType: typeof route.geometry,
      geometryKeys: route.geometry ? Object.keys(route.geometry).slice(0, 10) : null,
      routeKeys: Object.keys(route)
    });
    throw new Error('Unexpected geometry format from OpenRouteService');
  }

  const distance = route.summary.distance; // meters
  const duration = route.summary.duration; // seconds

  return {
    coordinates: routeCoordinates,
    distance: Math.round(distance),
    duration: Math.round(duration),
    summary: {
      distanceKm: Math.round(distance / 1000 * 100) / 100,
      durationMinutes: Math.round(duration / 60)
    }
  };
}

/**
 * Calculate direct route (fallback)
 */
function calculateDirectRoute(waypoints) {
  const coordinates = [];
  let totalDistance = 0;
  
  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];
    
    // Add start point
    coordinates.push({ lat: start.lat, lng: start.lng });
    
    // Calculate distance between waypoints (rough estimate)
    const latDiff = end.lat - start.lat;
    const lngDiff = end.lng - start.lng;
    const segmentDistance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000; // Convert to meters (rough)
    totalDistance += segmentDistance;
    
    // Add intermediate points for smoother lines
    const steps = Math.max(5, Math.floor(segmentDistance / 1000)); // More points for longer segments
    for (let step = 1; step < steps; step++) {
      const progress = step / steps;
      const lat = start.lat + (end.lat - start.lat) * progress;
      const lng = start.lng + (end.lng - start.lng) * progress;
      coordinates.push({ lat, lng });
    }
  }
  
  // Add final waypoint
  const lastWaypoint = waypoints[waypoints.length - 1];
  coordinates.push({ lat: lastWaypoint.lat, lng: lastWaypoint.lng });
  
  // Estimate duration (assuming 30 km/h average speed)
  const estimatedDuration = totalDistance / (30 * 1000 / 3600); // seconds
  
  return {
    coordinates,
    distance: Math.round(totalDistance),
    duration: Math.round(estimatedDuration),
    summary: {
      distanceKm: Math.round(totalDistance / 1000 * 100) / 100,
      durationMinutes: Math.round(estimatedDuration / 60)
    }
  };
}

module.exports = router;