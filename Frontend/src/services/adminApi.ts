import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { API_URL } from '@/config/api';
import { toast } from 'sonner';

export const adminApiClient = axios.create({
  baseURL: API_URL,
});

// Request interceptor to inject JWT bearer token from useAuthStore
adminApiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle 401s and other errors
adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'API request failed';

    if (status === 401) {
      const currentToken = useAuthStore.getState().token;
      if (currentToken) {
        useAuthStore.getState().logout();
        toast.error('Session expired. Please log in again.');
      }
      // Redirect to /login on 401 response
      window.location.href = '/login';
    } else {
      // Show toaster for server/general errors, except for optional silent background requests
      if (!error.config?.headers?.['X-Silent-Error']) {
        toast.error(message);
      }
    }
    return Promise.reject(error);
  }
);
