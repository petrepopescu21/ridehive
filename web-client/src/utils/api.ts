import axios from 'axios';
import { API_BASE_URL, ENDPOINTS } from '../../../shared/constants';
import type { 
  AuthResponse, 
  AuthStatus, 
  Map, 
  Ride, 
  RideWithUsers,
  Waypoint 
} from '../../../shared/types';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authAPI = {
  async login(password: string): Promise<AuthResponse> {
    console.log('📤 API: Attempting login with password:', password);
    console.log('📤 API: Posting to:', `${API_BASE_URL}${ENDPOINTS.AUTH.ORGANIZER}`);
    try {
      const response = await api.post(ENDPOINTS.AUTH.ORGANIZER, { password });
      console.log('✅ API: Login successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Login failed:', error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    console.log('📤 API: Attempting logout');
    await api.post(ENDPOINTS.AUTH.LOGOUT);
  },

  async getStatus(): Promise<AuthStatus> {
    console.log('📤 API: Checking auth status');
    try {
      const response = await api.get(ENDPOINTS.AUTH.STATUS);
      console.log('✅ API: Auth status response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Auth status failed:', error);
      throw error;
    }
  },
};

export const mapsAPI = {
  async getAll(): Promise<Map[]> {
    const response = await api.get(ENDPOINTS.MAPS.BASE);
    return response.data;
  },

  async getById(id: number): Promise<Map> {
    const response = await api.get(ENDPOINTS.MAPS.BY_ID(id));
    return response.data;
  },

  async create(data: { title: string; notes?: string; waypoints: Waypoint[] }): Promise<Map> {
    const response = await api.post(ENDPOINTS.MAPS.BASE, data);
    return response.data;
  },

  async update(id: number, data: { title: string; notes?: string; waypoints: Waypoint[] }): Promise<Map> {
    const response = await api.put(ENDPOINTS.MAPS.BY_ID(id), data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(ENDPOINTS.MAPS.BY_ID(id));
  },
};

export const ridesAPI = {
  async start(mapId: number): Promise<Ride & { userId: string }> {
    const response = await api.post(ENDPOINTS.RIDES.BASE, { mapId });
    return response.data;
  },

  async join(pinCode: string): Promise<Ride & { userId: string }> {
    const response = await api.post(ENDPOINTS.RIDES.JOIN, { pinCode });
    return response.data;
  },

  async getById(id: number): Promise<RideWithUsers> {
    const response = await api.get(ENDPOINTS.RIDES.BY_ID(id));
    return response.data;
  },

  async end(id: number): Promise<void> {
    await api.post(ENDPOINTS.RIDES.END(id));
  },
};

export default api;