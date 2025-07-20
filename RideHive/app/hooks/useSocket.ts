import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '../../../shared/constants';
import { ActiveUser, LocationUpdate, SocketEvents } from '../../../shared/types';

const SOCKET_URL = __DEV__ ? 'http://localhost:3001' : 'https://your-production-url.com';

export const useSocket = (rideId?: number, userId?: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<{ [userId: string]: ActiveUser }>({});
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!rideId || !userId) return;

    // Clean up any existing socket connection
    if (socketRef.current) {
      console.log('🧹 Cleaning up existing socket connection');
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    const socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Connected to socket server');
      setIsConnected(true);
      
      // Join the ride room
      console.log('🚗 Joining ride:', { rideId, userId });
      socket.emit(SOCKET_EVENTS.JOIN_RIDE, { rideId, userId });
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from socket server');
      setIsConnected(false);
    });

    socket.on(SOCKET_EVENTS.USER_SNAPSHOT, (snapshot: { [userId: string]: ActiveUser }) => {
      console.log('📸 Received user snapshot:', snapshot);
      console.log('📸 User snapshot entries:', Object.entries(snapshot).map(([id, user]) => ({
        id, 
        role: user.role, 
        hasLocation: !!(user.lat && user.lng)
      })));
      setActiveUsers(snapshot);
    });

    // Note: Individual location broadcasts removed - using scheduled snapshots only

    socket.on(SOCKET_EVENTS.USER_JOINED, ({ userId: newUserId }: { userId: string }) => {
      console.log(`User ${newUserId} joined the ride`);
    });

    socket.on(SOCKET_EVENTS.USER_LEFT, ({ userId: leftUserId }: { userId: string }) => {
      console.log(`User ${leftUserId} left the ride`);
      setActiveUsers(prev => {
        const updated = { ...prev };
        delete updated[leftUserId];
        return updated;
      });
    });

    socket.on(SOCKET_EVENTS.RIDE_ENDED, () => {
      console.log('Ride has ended');
      // Handle ride ending
    });

    socket.on(SOCKET_EVENTS.ERROR, ({ message }: { message: string }) => {
      console.error('🚨 Socket error:', message);
    });

    socket.on('connect_error', (error) => {
      console.error('🚨 Socket connection error:', error);
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      console.error('🚨 Socket general error:', error);
    });

    return () => {
      console.log('🧹 Cleaning up socket on unmount');
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [rideId, userId]);

  const sendLocationUpdate = (lat: number, lng: number) => {
    if (socketRef.current && isConnected && rideId && userId) {
      console.log('🌍 Sending location update:', { rideId, userId, lat, lng });
      socketRef.current.emit(SOCKET_EVENTS.LOCATION_UPDATE, {
        rideId,
        userId,
        lat,
        lng,
        role: 'rider',
      });
    } else {
      console.log('❌ Cannot send location update:', { 
        hasSocket: !!socketRef.current, 
        isConnected, 
        rideId, 
        userId 
      });
    }
  };

  return {
    isConnected,
    activeUsers,
    sendLocationUpdate,
    socket: socketRef.current,
  };
};