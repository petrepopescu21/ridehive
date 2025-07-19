import axios from 'axios';
import { API_BASE_URL, ENDPOINTS } from '../../../shared/constants';
import type { Ride } from '../../../shared/types';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ridesAPI = {
  async join(pinCode: string): Promise<Ride & { userId: string }> {
    const response = await api.post(ENDPOINTS.RIDES.JOIN, { pinCode });
    return response.data;
  },

  async getById(id: number): Promise<Ride> {
    const response = await api.get(ENDPOINTS.RIDES.BY_ID(id));
    return response.data;
  },
};

export default api;