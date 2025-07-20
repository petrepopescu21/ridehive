import { API_BASE_URL, ENDPOINTS } from '../../../shared/constants';
import { Ride, RideWithUsers } from '../../../shared/types';

const API_URL = __DEV__ ? 'http://localhost:3001' : API_BASE_URL;

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

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
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