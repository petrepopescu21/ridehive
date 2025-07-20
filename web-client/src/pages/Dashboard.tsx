import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { mapsAPI, ridesAPI } from '../utils/api';
import type { Map } from '../../../shared/types';

interface DashboardProps {
  onCreateMap: () => void;
  onEditMap: (mapId: number) => void;
  onStartRide: (rideId: number) => void;
  onOpenRide?: (rideId: number) => void;
}

export const Dashboard = ({ onCreateMap, onEditMap, onStartRide, onOpenRide }: DashboardProps) => {
  const { logout } = useAuth();
  const [maps, setMaps] = useState<Map[]>([]);
  const [activeRides, setActiveRides] = useState<(import('../../../shared/types').Ride & { activeUserCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingRide, setStartingRide] = useState<number | null>(null);

  const loadMaps = async () => {
    try {
      setLoading(true);
      setError(null);
      const [mapsData, ridesData] = await Promise.all([
        mapsAPI.getAll(),
        ridesAPI.getAll()
      ]);
      setMaps(mapsData);
      setActiveRides(ridesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRide = async (mapId: number) => {
    try {
      setStartingRide(mapId);
      setError(null);
      const ride = await ridesAPI.start(mapId);
      onStartRide(ride.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start ride');
    } finally {
      setStartingRide(null);
    }
  };

  const handleDeleteMap = async (mapId: number, mapTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${mapTitle}"?`)) return;

    try {
      await mapsAPI.delete(mapId);
      setMaps(prev => prev.filter(m => m.id !== mapId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete map');
    }
  };

  useEffect(() => {
    loadMaps();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RideHive Organizer</h1>
              <p className="text-gray-600">Manage your ride maps and sessions</p>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Active Rides Section */}
        {activeRides.length > 0 && (
          <div className="px-4 py-6 sm:px-0">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Active Rides</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              {activeRides.map((ride) => (
                <div key={ride.id} className="bg-green-50 border border-green-200 overflow-hidden shadow rounded-lg">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">{ride.title}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Live
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-4">
                      <p>Rider PIN: <span className="font-mono font-bold text-lg bg-blue-100 px-2 py-1 rounded">{ride.rider_pin}</span></p>
                      <p>Organizer PIN: <span className="font-mono font-bold text-lg bg-green-100 px-2 py-1 rounded">{ride.organizer_pin}</span></p>
                      <p>Started: {new Date(ride.started_at).toLocaleString()}</p>
                      <p>Active users: {ride.activeUserCount}</p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onOpenRide ? onOpenRide(ride.id) : onStartRide(ride.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                      >
                        Open Ride
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">Your Maps</h2>
            <button
              onClick={onCreateMap}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Create New Map
            </button>
          </div>

          {/* Maps Grid */}
          {maps.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No maps yet</h3>
              <p className="text-gray-500 mb-4">Create your first map to start organizing rides</p>
              <button
                onClick={onCreateMap}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Create Your First Map
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {maps.map((map) => (
                <div key={map.id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 truncate">{map.title}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {map.waypoints.length} waypoints
                      </span>
                    </div>
                    
                    {map.notes && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{map.notes}</p>
                    )}
                    
                    <div className="text-xs text-gray-500 mb-4">
                      Created {new Date(map.created_at).toLocaleDateString()}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStartRide(map.id)}
                        disabled={startingRide === map.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium disabled:bg-gray-400"
                      >
                        {startingRide === map.id ? 'Starting...' : 'Start Ride'}
                      </button>
                      <button
                        onClick={() => onEditMap(map.id)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMap(map.id, map.title)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};