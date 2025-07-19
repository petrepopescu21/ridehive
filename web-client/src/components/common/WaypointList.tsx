import type { Waypoint } from '../../../../shared/types';

interface WaypointListProps {
  waypoints: Waypoint[];
  onWaypointsChange: (waypoints: Waypoint[]) => void;
  readonly?: boolean;
}

export const WaypointList = ({ waypoints, onWaypointsChange, readonly = false }: WaypointListProps) => {
  const moveWaypoint = (fromIndex: number, toIndex: number) => {
    if (readonly) return;
    
    const updated = [...waypoints];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);
    onWaypointsChange(updated);
  };

  const updateWaypointName = (index: number, name: string) => {
    if (readonly) return;
    
    const updated = [...waypoints];
    updated[index] = { ...updated[index], name };
    onWaypointsChange(updated);
  };

  const removeWaypoint = (index: number) => {
    if (readonly) return;
    
    const updated = waypoints.filter((_, i) => i !== index);
    onWaypointsChange(updated);
  };

  if (waypoints.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {readonly ? 'No waypoints defined' : 'Click on the map to add waypoints'}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-gray-900 mb-3">
        Waypoints ({waypoints.length})
      </h3>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {waypoints.map((waypoint, index) => (
          <div
            key={index}
            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
              {index + 1}
            </div>
            
            <div className="flex-1 min-w-0">
              {readonly ? (
                <div>
                  <div className="font-medium text-sm">{waypoint.name}</div>
                  <div className="text-xs text-gray-600">
                    {waypoint.lat.toFixed(4)}, {waypoint.lng.toFixed(4)}
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  value={waypoint.name}
                  onChange={(e) => updateWaypointName(index, e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Waypoint name"
                />
              )}
            </div>
            
            {!readonly && (
              <div className="flex space-x-1">
                {index > 0 && (
                  <button
                    onClick={() => moveWaypoint(index, index - 1)}
                    className="p-1 text-gray-600 hover:text-gray-900"
                    title="Move up"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                )}
                
                {index < waypoints.length - 1 && (
                  <button
                    onClick={() => moveWaypoint(index, index + 1)}
                    className="p-1 text-gray-600 hover:text-gray-900"
                    title="Move down"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
                
                <button
                  onClick={() => removeWaypoint(index)}
                  className="p-1 text-red-600 hover:text-red-900"
                  title="Remove waypoint"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};