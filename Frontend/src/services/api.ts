import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import {
	API_URL,
} from '@/config/api'

const BASE_URL = `${API_URL}`;

export const apiClient = axios.create({
  baseURL: BASE_URL,
});

// Intercept requests to inject JWT
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  const isPublicRoute = config.url === '/login' || config.url === '/register';
  if (token && config.headers && !isPublicRoute) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses to handle 401s
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
