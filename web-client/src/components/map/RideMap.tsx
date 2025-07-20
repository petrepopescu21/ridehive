import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon } from 'leaflet';
import * as L from 'leaflet';
import { DEFAULT_MAP_CENTER, MAP_ZOOM_LEVELS, USER_COLORS } from '../../../../shared/constants';
import type { Waypoint, ActiveUser, RouteCoordinate } from '../../../../shared/types';

// Custom circle icons for different user types
const createCircleIcon = (color: string, size: number = 12) => {
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${size * 2}" height="${size * 2}" viewBox="0 0 ${size * 2} ${size * 2}">
        <circle cx="${size}" cy="${size}" r="${size - 2}" fill="${color}" stroke="white" stroke-width="2"/>
      </svg>
    `)}`,
    iconSize: [size * 2, size * 2],
    iconAnchor: [size, size],
    popupAnchor: [0, -size],
    className: 'circle-marker'
  });
};

const organizerIcon = createCircleIcon('#dc2626', 10); // Red circle for organizer
const riderIcon = createCircleIcon('#2563eb', 8);      // Blue circle for rider

const waypointIcon = new Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'waypoint-marker'
});

interface RideMapProps {
  waypoints: Waypoint[];
  activeUsers: { [userId: string]: ActiveUser };
  routeCoordinates?: RouteCoordinate[];
  center?: { lat: number; lng: number };
}

export const RideMap = ({ waypoints, activeUsers, routeCoordinates = [], center }: RideMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation && !center) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Could not get user location:', error.message);
        }
      );
    }
  }, [center]);

  // Calculate map center based on waypoints, user location, or default
  const mapCenter = center || 
    (waypoints.length > 0 
      ? {
          lat: waypoints.reduce((sum, wp) => sum + wp.lat, 0) / waypoints.length,
          lng: waypoints.reduce((sum, wp) => sum + wp.lng, 0) / waypoints.length,
        }
      : userLocation || DEFAULT_MAP_CENTER);

  // Auto-fit bounds when users or waypoints change (throttled)
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const allPoints: [number, number][] = [];

    // Add waypoints
    waypoints.forEach(wp => {
      allPoints.push([wp.lat, wp.lng]);
    });

    // Add user locations
    Object.values(activeUsers).forEach(user => {
      if (user.lat !== null && user.lng !== null) {
        allPoints.push([user.lat, user.lng]);
      }
    });

    if (allPoints.length > 1) {
      // Throttle map bounds updates to prevent excessive recalculation
      const timeoutId = setTimeout(() => {
        try {
          map.fitBounds(allPoints, { padding: [20, 20] });
        } catch (error) {
          console.warn('Error fitting map bounds:', error);
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [waypoints, activeUsers]);

  // Get route polyline points
  // Use saved route coordinates if available, otherwise connect waypoints directly
  const routePoints: [number, number][] = routeCoordinates.length > 0 
    ? routeCoordinates.map(coord => [coord.lat, coord.lng])
    : waypoints.map(wp => [wp.lat, wp.lng]);

  return (
    <div className="h-full w-full relative">
      <MapContainer
        ref={mapRef}
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={MAP_ZOOM_LEVELS.DEFAULT}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Route polyline */}
        {routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            color="#6366f1"
            weight={3}
            opacity={0.7}
          />
        )}
        
        {/* Waypoint markers */}
        {waypoints.map((waypoint, index) => (
          <Marker
            key={`waypoint-${index}`}
            position={[waypoint.lat, waypoint.lng]}
            icon={waypointIcon}
          >
            <Popup>
              <div className="text-center">
                <div className="font-medium text-sm text-indigo-600">Waypoint {index + 1}</div>
                <div className="text-sm">{waypoint.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {waypoint.lat.toFixed(4)}, {waypoint.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Active user markers */}
        {Object.entries(activeUsers).map(([userId, user]) => {
          if (user.lat === null || user.lng === null) return null;
          
          return (
            <Marker
              key={`user-${userId}`}
              position={[user.lat, user.lng]}
              icon={user.role === 'organizer' ? organizerIcon : riderIcon}
            >
              <Popup>
                <div className="text-center">
                  <div className={`font-medium text-sm ${user.role === 'organizer' ? 'text-red-600' : 'text-blue-600'}`}>
                    {user.role === 'organizer' ? 'Organizer' : 'Rider'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Last seen: {new Date(user.lastSeen).toLocaleTimeString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.lat.toFixed(4)}, {user.lng.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-indigo-500 rounded"></div>
            <span>Route</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-500 rounded"></div>
            <span>Waypoints</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: USER_COLORS.ORGANIZER }}></div>
            <span>Organizer</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: USER_COLORS.RIDER }}></div>
            <span>Riders</span>
          </div>
        </div>
      </div>
    </div>
  );
};