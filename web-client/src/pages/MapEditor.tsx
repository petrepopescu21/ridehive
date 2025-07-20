import { useState, useEffect, useCallback } from 'react';
import { MapEditor as MapEditorComponent } from '../components/map/MapEditor';
import { WaypointList } from '../components/common/WaypointList';
import { mapsAPI } from '../utils/api';
import type { Waypoint } from '../../../shared/types';

interface MapEditorPageProps {
  mapId?: number;
  onBack: () => void;
}

export const MapEditorPage = ({ mapId, onBack }: MapEditorPageProps) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!mapId;

  useEffect(() => {
    if (mapId) {
      loadMap();
    }
  }, [mapId, loadMap]);

  const loadMap = useCallback(async () => {
    if (!mapId) return;

    try {
      setLoading(true);
      setError(null);
      const map = await mapsAPI.getById(mapId);
      setTitle(map.title);
      setNotes(map.notes || '');
      setWaypoints(map.waypoints);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load map');
    } finally {
      setLoading(false);
    }
  }, [mapId]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Map title is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const mapData = {
        title: title.trim(),
        notes: notes.trim(),
        waypoints,
      };

      if (isEditing && mapId) {
        await mapsAPI.update(mapId, mapData);
      } else {
        await mapsAPI.create(mapData);
      }

      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save map');
    } finally {
      setSaving(false);
    }
  };

  const clearAllWaypoints = () => {
    if (confirm('Are you sure you want to remove all waypoints?')) {
      setWaypoints([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Map' : 'Create New Map'}
              </h1>
            </div>
            
            <div className="flex space-x-3">
              {waypoints.length > 0 && (
                <button
                  onClick={clearAllWaypoints}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400"
              >
                {saving ? 'Saving...' : (isEditing ? 'Update Map' : 'Create Map')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Left Panel - Map Details */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Map Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter map title"
                  />
                </div>
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Optional notes about this map"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <WaypointList
                waypoints={waypoints}
                onWaypointsChange={setWaypoints}
              />
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Instructions</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Click on the map to add waypoints</li>
                <li>• Click on markers to edit or remove them</li>
                <li>• Use the waypoint list to reorder points</li>
                <li>• Save your map to use it for rides</li>
              </ul>
            </div>
          </div>

          {/* Right Panel - Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow h-96 lg:h-full">
              <MapEditorComponent
                waypoints={waypoints}
                onWaypointsChange={setWaypoints}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};