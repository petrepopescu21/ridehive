import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL, SOCKET_EVENTS } from '../../../shared/constants';
import type { ActiveUser } from '../../../shared/types';

interface UseSocketProps {
  rideId?: number;
  userId?: string;
  enabled?: boolean;
}

export const useSocket = ({ rideId, userId, enabled = true }: UseSocketProps = {}) => {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<{ [userId: string]: ActiveUser }>({});
  const [error, setError] = useState<string | null>(null);

  const connect = () => {
    if (socketRef.current?.connected) return;

    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    socketRef.current = io(API_BASE_URL, {
      withCredentials: true,
    });

    socketRef.current.on('connect', () => {
      setConnected(true);
      setError(null);
    });

    socketRef.current.on('disconnect', () => {
      setConnected(false);
    });

    socketRef.current.on(SOCKET_EVENTS.ERROR, ({ message }: { message: string }) => {
      setError(message);
    });

    socketRef.current.on(SOCKET_EVENTS.USER_SNAPSHOT, (users: { [userId: string]: ActiveUser }) => {
      setActiveUsers(users);
    });

    socketRef.current.on(SOCKET_EVENTS.USER_JOINED, ({ userId: newUserId }: { userId: string }) => {
      console.log(`User ${newUserId} joined the ride`);
    });

    socketRef.current.on(SOCKET_EVENTS.USER_LEFT, ({ userId: leftUserId }: { userId: string }) => {
      setActiveUsers(prev => {
        const updated = { ...prev };
        delete updated[leftUserId];
        return updated;
      });
    });

    // Note: Individual location broadcasts removed - using scheduled snapshots only

    socketRef.current.on(SOCKET_EVENTS.RIDE_ENDED, () => {
      setActiveUsers({});
    });
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
      setActiveUsers({});
    }
  };

  const joinRide = (rideId: number, userId: string) => {
    if (!socketRef.current?.connected) return;

    socketRef.current.emit(SOCKET_EVENTS.JOIN_RIDE, { rideId, userId });
  };

  const updateLocation = useCallback((rideId: number, userId: string, lat: number, lng: number, role: 'organizer' | 'rider') => {
    if (!socketRef.current?.connected) return;

    socketRef.current.emit(SOCKET_EVENTS.LOCATION_UPDATE, {
      rideId,
      userId,
      lat,
      lng,
      role,
    });
  }, []);

  const endRide = (rideId: number) => {
    if (!socketRef.current?.connected) return;

    socketRef.current.emit(SOCKET_EVENTS.END_RIDE, { rideId });
  };

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled]);

  useEffect(() => {
    if (connected && rideId && userId) {
      joinRide(rideId, userId);
    }
  }, [connected, rideId, userId]);

  return {
    connected,
    activeUsers,
    error,
    connect,
    disconnect,
    joinRide,
    updateLocation,
    endRide,
  };
};