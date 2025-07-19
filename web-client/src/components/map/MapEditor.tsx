import { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon, LatLng } from 'leaflet';
import { DEFAULT_MAP_CENTER, MAP_ZOOM_LEVELS } from '../../../../shared/constants';
import type { Waypoint } from '../../../../shared/types';

// Fix for default markers
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapEditorProps {
  waypoints: Waypoint[];
  onWaypointsChange: (waypoints: Waypoint[]) => void;
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

export const MapEditor = ({ waypoints, onWaypointsChange, readonly = false }: MapEditorProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (readonly) return;
    
    const newWaypoint: Waypoint = {
      lat,
      lng,
      name: `Waypoint ${waypoints.length + 1}`,
    };
    onWaypointsChange([...waypoints, newWaypoint]);
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

  const startEditing = (index: number, currentName: string) => {
    setEditingIndex(index);
    setEditingName(currentName);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingName('');
  };

  // Calculate map center based on waypoints
  const mapCenter = waypoints.length > 0 
    ? {
        lat: waypoints.reduce((sum, wp) => sum + wp.lat, 0) / waypoints.length,
        lng: waypoints.reduce((sum, wp) => sum + wp.lng, 0) / waypoints.length,
      }
    : DEFAULT_MAP_CENTER;

  return (
    <div className="h-full w-full">
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
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
      </MapContainer>
    </div>
  );
};