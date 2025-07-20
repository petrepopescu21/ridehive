import type { Waypoint, RouteCoordinate } from '../../../shared/types';
import { API_BASE_URL } from '../../../shared/constants';

interface RouteResponse {
  coordinates: RouteCoordinate[];
  distance: number;
  duration: number;
  method: 'openrouteservice' | 'direct' | 'error';
  fallback_reason?: string;
  summary?: {
    distanceKm: number;
    durationMinutes: number;
  };
}

/**
 * Calculate route between waypoints using our server proxy
 * @param waypoints Array of waypoints to route through
 * @returns Promise<RouteCoordinate[]> Array of coordinates for the polyline
 */
export const calculateRoute = async (waypoints: Waypoint[]): Promise<RouteCoordinate[]> => {
  if (waypoints.length < 2) {
    throw new Error('At least 2 waypoints required for routing');
  }

  try {
    console.log('🗺️ Calculating route for waypoints:', waypoints.map(wp => wp.name));

    const response = await fetch(`${API_BASE_URL}/api/routing/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include auth cookies
      body: JSON.stringify({ waypoints })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `Routing failed: ${response.status}`);
    }

    const data: RouteResponse = await response.json();
    
    if (!data.coordinates || data.coordinates.length === 0) {
      throw new Error('No route found between the waypoints');
    }

    const method = data.method === 'openrouteservice' ? 'OpenRouteService' : 
                  data.method === 'direct' ? 'direct lines (fallback)' : 'unknown';
    
    if (data.summary) {
      const fallbackMsg = data.fallback_reason ? ` (reason: ${data.fallback_reason})` : '';
      console.log(`✅ Route calculated with ${method}: ${data.summary.distanceKm}km, ${data.summary.durationMinutes} minutes, ${data.coordinates.length} points${fallbackMsg}`);
    } else {
      console.log(`✅ Route calculated with ${method}: ${data.coordinates.length} points`);
    }
    
    return data.coordinates;

  } catch (error) {
    console.error('❌ Route calculation failed:', error);
    throw error;
  }
};

/**
 * Alternative: Calculate simple direct lines between waypoints
 * Fallback option if routing service is unavailable
 */
export const calculateDirectRoute = (waypoints: Waypoint[]): RouteCoordinate[] => {
  console.log('🗺️ Using direct line routing (fallback)');
  
  const routeCoordinates: RouteCoordinate[] = [];
  
  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];
    
    // Add start point
    routeCoordinates.push({ lat: start.lat, lng: start.lng });
    
    // Add intermediate points for smoother lines (optional)
    const steps = 10;
    for (let step = 1; step < steps; step++) {
      const progress = step / steps;
      const lat = start.lat + (end.lat - start.lat) * progress;
      const lng = start.lng + (end.lng - start.lng) * progress;
      routeCoordinates.push({ lat, lng });
    }
  }
  
  // Add final waypoint
  const lastWaypoint = waypoints[waypoints.length - 1];
  routeCoordinates.push({ lat: lastWaypoint.lat, lng: lastWaypoint.lng });
  
  return routeCoordinates;
};

/**
 * Calculate route with fallback to direct routing
 */
export const calculateRouteWithFallback = async (waypoints: Waypoint[]): Promise<RouteCoordinate[]> => {
  try {
    return await calculateRoute(waypoints);
  } catch (error) {
    console.warn('⚠️ Routing service failed, falling back to direct lines:', error);
    return calculateDirectRoute(waypoints);
  }
};