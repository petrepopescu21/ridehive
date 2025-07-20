import { API_BASE_URL, ENDPOINTS } from '../../../shared/constants';
import { Ride, RideWithUsers } from '../../../shared/types';

import { Platform } from 'react-native';

// For mobile devices (iOS/Android), always use production URL
// Only use localhost for web platform in development
const isWeb = Platform.OS === 'web';
const API_URL = isWeb && __DEV__ 
  ? 'http://localhost:3001' 
  : 'https://ridehive-app-d5258a8e7e80.herokuapp.com';

console.log('🔧 [API] Configuration:', {
  API_URL,
  __DEV__,
  Platform: Platform.OS,
  isWeb,
  NODE_ENV: process.env.NODE_ENV
});

class APIClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    console.log('🌐 [API] Making request:', {
      url,
      method: config.method || 'GET',
      headers: config.headers,
      body: config.body
    });

    try {
      const response = await fetch(url, config);
      
      console.log('📡 [API] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [API] Error response data:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [API] Success response data:', data);
      return data;
    } catch (error) {
      console.error('💥 [API] Request failed:', error);
      throw error;
    }
  }

  async joinRide(pinCode: string): Promise<RideWithUsers> {
    return this.request<RideWithUsers>(ENDPOINTS.RIDES.JOIN, {
      method: 'POST',
      body: JSON.stringify({ pinCode }),
    });
  }

  async getRide(rideId: number): Promise<RideWithUsers> {
    return this.request<RideWithUsers>(ENDPOINTS.RIDES.BY_ID(rideId));
  }
}

export const ridesAPI = new APIClient();