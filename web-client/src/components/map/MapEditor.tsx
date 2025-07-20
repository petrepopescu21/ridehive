import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import * as L from 'leaflet';
import { DEFAULT_MAP_CENTER, MAP_ZOOM_LEVELS } from '../../../../shared/constants';
import type { Waypoint, RouteCoordinate } from '../../../../shared/types';
import { calculateRouteWithFallback } from '../../utils/routingService';

// Fix for default markers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapEditorProps {
  waypoints: Waypoint[];
  onWaypointsChange: (waypoints: Waypoint[]) => void;
  routeCoordinates?: RouteCoordinate[];
  onRouteChange?: (routeCoordinates: RouteCoordinate[]) => void;
  readonly?: boolean;
}

const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export const MapEditor = ({ 
  waypoints, 
  onWaypointsChange, 
  routeCoordinates = [], 
  onRouteChange,
  readonly = false 
}: MapEditorProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
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
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (readonly) return;
    
    const newWaypoint: Waypoint = {
      lat,
      lng,
      name: `Waypoint ${waypoints.length + 1}`,
    };
    const newWaypoints = [...waypoints, newWaypoint];
    onWaypointsChange(newWaypoints);
  }, [waypoints, onWaypointsChange, readonly]);

  const handleWaypointNameChange = (index: number, newName: string) => {
    const updated = [...waypoints];
    updated[index] = { ...updated[index], name: newName };
    onWaypointsChange(updated);
    setEditingIndex(null);
    setEditingName('');
  };

  const handleRemoveWaypoint = (index: number) => {
    const updated = waypoints.filter((_, i) => i !== index);
    onWaypointsChange(updated);
  };

  const handleMarkerDragEnd = (index: number, event: L.DragEndEvent) => {
    if (readonly) return;
    
    const newPosition = event.target.getLatLng();
    const updated = [...waypoints];
    updated[index] = {
      ...updated[index],
      lat: newPosition.lat,
      lng: newPosition.lng,
    };
    onWaypointsChange(updated);
  };

  const startEditing = (index: number, currentName: string) => {
    setEditingIndex(index);
    setEditingName(currentName);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingName('');
  };

  // Calculate route between waypoints
  const handleCalculateRoute = useCallback(async () => {
    if (waypoints.length < 2) {
      return;
    }

    if (!onRouteChange) {
      console.warn('onRouteChange callback not provided');
      return;
    }

    try {
      const calculatedRoute = await calculateRouteWithFallback(waypoints);
      onRouteChange(calculatedRoute);
      
      console.log('✅ Route calculated successfully');
    } catch (error) {
      console.error('❌ Route calculation error:', error);
    }
  }, [waypoints, onRouteChange]);

  // Auto-calculate route when waypoints change
  useEffect(() => {
    if (readonly) return;
    if (waypoints.length < 2) {
      // Clear route if less than 2 waypoints
      if (routeCoordinates.length > 0 && onRouteChange) {
        onRouteChange([]);
      }
      return;
    }

    // Auto-calculate route with a small debounce
    const timeoutId = setTimeout(() => {
      handleCalculateRoute();
    }, 500); // 500ms debounce to avoid too many API calls

    return () => clearTimeout(timeoutId);
  }, [waypoints, readonly, onRouteChange, handleCalculateRoute, routeCoordinates.length]);

  // Use a stable map center - only calculate once or when there are no waypoints
  const [initialCenter] = useState(() => {
    if (waypoints.length > 0) {
      return {
        lat: waypoints.reduce((sum, wp) => sum + wp.lat, 0) / waypoints.length,
        lng: waypoints.reduce((sum, wp) => sum + wp.lng, 0) / waypoints.length,
      };
    }
    return userLocation || DEFAULT_MAP_CENTER;
  });

  return (
    <div className="h-full w-full relative">
      <MapContainer
        key={`map-${waypoints.length}`}
        center={[initialCenter.lat, initialCenter.lng]}
        zoom={MAP_ZOOM_LEVELS.DEFAULT}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {!readonly && <MapClickHandler onMapClick={handleMapClick} />}
        
        {waypoints.map((waypoint, index) => (
          <Marker
            key={index}
            position={[waypoint.lat, waypoint.lng]}
            draggable={!readonly}
            eventHandlers={{
              dragend: (event) => handleMarkerDragEnd(index, event),
            }}
          >
            <Popup>
              <div className="min-w-48">
                {editingIndex === index ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Waypoint name"
                      autoFocus
                    />
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleWaypointNameChange(index, editingName)}
                        className="flex-1 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="flex-1 bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="font-medium text-sm">{waypoint.name}</div>
                    <div className="text-xs text-gray-600">
                      {waypoint.lat.toFixed(4)}, {waypoint.lng.toFixed(4)}
                    </div>
                    {!readonly && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => startEditing(index, waypoint.name)}
                          className="flex-1 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemoveWaypoint(index)}
                          className="flex-1 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Display calculated route */}
        {routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates.map(coord => [coord.lat, coord.lng])}
            color="#3b82f6"
            weight={4}
            opacity={0.7}
          />
        )}
      </MapContainer>
      
    </div>
  );
};