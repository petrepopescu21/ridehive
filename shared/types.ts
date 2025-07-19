export interface Waypoint {
  lat: number;
  lng: number;
  name: string;
}

export interface Map {
  id: number;
  title: string;
  notes: string;
  waypoints: Waypoint[];
  created_at: string;
  updated_at: string;
}

export interface Ride {
  id: number;
  map_id: number;
  pin_code: string;
  status: 'active' | 'ended';
  started_at: string;
  ended_at?: string;
  title?: string;
  notes?: string;
  waypoints?: Waypoint[];
}

export interface ActiveUser {
  userId: string;
  role: 'organizer' | 'rider';
  lat: number | null;
  lng: number | null;
  lastSeen: string;
  connectedAt: string;
}

export interface RideWithUsers extends Ride {
  activeUsers: ActiveUser[];
}

export interface LocationUpdate {
  userId: string;
  lat: number;
  lng: number;
  role: 'organizer' | 'rider';
  timestamp: number;
}

export interface SocketEvents {
  'join-ride': { rideId: number; userId: string };
  'location-update': { rideId: number; userId: string; lat: number; lng: number; role: 'organizer' | 'rider' };
  'location-broadcast': LocationUpdate;
  'user-snapshot': { [userId: string]: ActiveUser };
  'user-joined': { userId: string; timestamp: number };
  'user-left': { userId: string; timestamp: number };
  'end-ride': { rideId: number };
  'ride-ended': { rideId: number; timestamp: number };
  'error': { message: string };
}

export interface AuthResponse {
  message: string;
  userId: string;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  userId: string | null;
}