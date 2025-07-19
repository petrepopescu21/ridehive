import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon } from 'leaflet';
import { DEFAULT_MAP_CENTER, MAP_ZOOM_LEVELS, USER_COLORS } from '../../../../shared/constants';
import type { Waypoint, ActiveUser } from '../../../../shared/types';

// Custom icons for different user types
const organizerIcon = new Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'organizer-marker'
});

const riderIcon = new Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [1, -28],
  shadowSize: [33, 33],
  className: 'rider-marker'
});

interface RideMapProps {
  waypoints: Waypoint[];
  activeUsers: { [userId: string]: ActiveUser };
  center?: { lat: number; lng: number };
}

export const RideMap = ({ waypoints, activeUsers, center }: RideMapProps) => {
  const mapRef = useRef<any>(null);

  // Calculate map center based on waypoints or active users
  const mapCenter = center || 
    (waypoints.length > 0 
      ? {
          lat: waypoints.reduce((sum, wp) => sum + wp.lat, 0) / waypoints.length,
          lng: waypoints.reduce((sum, wp) => sum + wp.lng, 0) / waypoints.length,
        }
      : DEFAULT_MAP_CENTER);

  // Auto-fit bounds when users or waypoints change
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
      map.fitBounds(allPoints, { padding: [20, 20] });
    }
  }, [waypoints, activeUsers]);

  // Get route polyline points
  const routePoints: [number, number][] = waypoints.map(wp => [wp.lat, wp.lng]);

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
            icon={new Icon({
              iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
              iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
              className: 'waypoint-marker'
            })}
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