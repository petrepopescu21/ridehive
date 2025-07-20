export const API_BASE_URL = 'http://localhost:3001';

export const ENDPOINTS = {
  AUTH: {
    ORGANIZER: '/api/auth/organizer',
    LOGOUT: '/api/auth/logout',
    STATUS: '/api/auth/status',
  },
  MAPS: {
    BASE: '/api/maps',
    BY_ID: (id: number) => `/api/maps/${id}`,
  },
  RIDES: {
    BASE: '/api/rides',
    JOIN: '/api/rides/join',
    BY_ID: (id: number) => `/api/rides/${id}`,
    END: (id: number) => `/api/rides/${id}/end`,
  },
} as const;

export const SOCKET_EVENTS = {
  JOIN_RIDE: 'join-ride',
  LOCATION_UPDATE: 'location-update',
  LOCATION_BROADCAST: 'location-broadcast',
  USER_SNAPSHOT: 'user-snapshot',
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  END_RIDE: 'end-ride',
  RIDE_ENDED: 'ride-ended',
  ERROR: 'error',
} as const;

export const DEFAULT_MAP_CENTER = {
  lat: 44.4268,
  lng: 26.1025,
} as const;

export const MAP_ZOOM_LEVELS = {
  DEFAULT: 13,
  CLOSE: 16,
  FAR: 10,
} as const;

export const USER_COLORS = {
  ORGANIZER: '#dc2626', // red-600
  RIDER: '#2563eb', // blue-600
} as const;

export const LOCATION_UPDATE_INTERVAL = 5000; // 5 seconds
export const HEARTBEAT_INTERVAL = 30000; // 30 seconds
export const INACTIVE_USER_THRESHOLD = 120000; // 2 minutes