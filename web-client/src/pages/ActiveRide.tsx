import { useState, useEffect, useCallback } from 'react';
import { RideMap } from '../components/map/RideMap';
import { WaypointList } from '../components/common/WaypointList';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { ridesAPI } from '../utils/api';
import type { RideWithUsers } from '../../../shared/types';

interface ActiveRideProps {
  rideId: number;
  onEndRide: () => void;
}

export const ActiveRide = ({ rideId, onEndRide }: ActiveRideProps) => {
  const { userId } = useAuth();
  const [ride, setRide] = useState<RideWithUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);

  const { 
    connected, 
    activeUsers, 
    endRide: socketEndRide,
    error: socketError 
  } = useSocket({ 
    rideId, 
    userId: userId || undefined, 
    enabled: !!userId 
  });

  // Organizers don't need location tracking
  const locationError = null;

  // Load ride details
  const loadRide = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rideData = await ridesAPI.getById(rideId);
      setRide(rideData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ride');
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  // Organizer doesn't send location updates, only receives them from riders
  // Location tracking is removed for organizers but socket connection remains for receiving updates

  // Handle ride end
  const handleEndRide = async () => {
    if (!confirm('Are you sure you want to end this ride? All participants will be disconnected.')) {
      return;
    }

    try {
      setEnding(true);
      setError(null);
      
      // End ride via API
      await ridesAPI.end(rideId);
      
      // Notify via socket
      socketEndRide(rideId);
      
      // No location tracking for organizers
      
      onEndRide();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end ride');
    } finally {
      setEnding(false);
    }
  };

  const copyPinCode = (pinCode: string) => {
    if (pinCode) {
      navigator.clipboard.writeText(pinCode);
      // Could add a toast notification here
    }
  };

  useEffect(() => {
    loadRide();
  }, [loadRide]);

  // No location tracking needed for organizers

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ride...</p>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Ride not found</p>
          <button
            onClick={onEndRide}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const activeUserCount = Object.keys(activeUsers).length;
  const riderCount = Object.values(activeUsers).filter(u => u.role === 'rider').length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Active Ride: {ride.title}
              </h1>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-sm text-gray-600">
                  Rider PIN: <code className="bg-blue-100 px-2 py-1 rounded font-mono">{ride.rider_pin}</code>
                </span>
                <span className="text-sm text-gray-600">
                  Organizer PIN: <code className="bg-green-100 px-2 py-1 rounded font-mono">{ride.organizer_pin}</code>
                </span>
                <button
                  onClick={() => copyPinCode(ride.rider_pin)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Copy Rider PIN
                </button>
                <button
                  onClick={() => copyPinCode(ride.organizer_pin)}
                  className="text-xs text-green-600 hover:text-green-800"
                >
                  Copy Organizer PIN
                </button>
              </div>
            </div>
            
            <button
              onClick={handleEndRide}
              disabled={ending}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400"
            >
              {ending ? 'Ending...' : 'End Ride'}
            </button>
          </div>
        </div>
      </header>

      {/* Status Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="text-sm text-gray-600">
                {activeUserCount} active participant{activeUserCount !== 1 ? 's' : ''}
                {riderCount > 0 && ` (${riderCount} rider${riderCount !== 1 ? 's' : ''})`}
              </div>
              
            </div>
            
            <div className="text-xs text-gray-500">
              Started: {new Date(ride.started_at).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {(error || socketError || locationError) && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error || socketError || locationError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          {/* Left Panel - Ride Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Ride Information</h2>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Rider PIN:</span>
                  <div className="mt-1 text-lg font-mono bg-blue-100 px-3 py-2 rounded">
                    {ride.rider_pin}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Organizer PIN:</span>
                  <div className="mt-1 text-lg font-mono bg-green-100 px-3 py-2 rounded">
                    {ride.organizer_pin}
                  </div>
                </div>
                
                {ride.notes && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Notes:</span>
                    <p className="mt-1 text-sm text-gray-600">{ride.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <WaypointList
                waypoints={ride.waypoints || []}
                onWaypointsChange={() => {}} // Read-only
                readonly
              />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Active Participants</h3>
              
              {activeUserCount === 0 ? (
                <p className="text-sm text-gray-500">No active participants</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(activeUsers).map(([userId, user]) => (
                    <div key={userId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${user.role === 'organizer' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                        <span className="text-sm font-medium capitalize">{user.role}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(user.lastSeen).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Map */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow h-96 lg:h-full">
              <RideMap
                waypoints={ride.waypoints || []}
                activeUsers={activeUsers}
                routeCoordinates={ride.route_coordinates || []}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};