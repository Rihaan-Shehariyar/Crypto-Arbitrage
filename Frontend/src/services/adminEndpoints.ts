import { adminApiClient } from './adminApi';
import type { 
  AdminUser, 
  AdminStats, 
  AdminSystemHealth, 
  AdminUserTradesResponse 
} from '@/types/admin';

export const adminLogin = async (credentials: Record<string, string>): Promise<{ token: string; user: AdminUser }> => {
  const response = await adminApiClient.post<{ token: string; user: AdminUser }>('/admin/login', credentials);
  return response.data;
};

export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await adminApiClient.get<AdminStats>('/admin/stats');
  return response.data;
};

export const getAdminSystem = async (): Promise<AdminSystemHealth> => {
  const response =
  await adminApiClient.get(
    '/admin/system'
  )
  return response.data;
};

export const getAdminUsers = async (): Promise<{ users: AdminUser[] }> => {
  const response = await adminApiClient.get<{ users: AdminUser[] }>('/admin/users');
  return response.data;
};

export const getAdminUser = async (id: string): Promise<AdminUser> => {
  const response = await adminApiClient.get<AdminUser>(`/admin/users/${id}`);
  return response.data;
};

export const getAdminUserTrades = async (id: string): Promise<AdminUserTradesResponse> => {
  const response = await adminApiClient.get<AdminUserTradesResponse>(`/admin/users/${id}/trades`);
  return response.data;
};

export const activateSubscription = async (id: string): Promise<{ message: string }> => {
  const response = await adminApiClient.post<{ message: string }>(`/admin/users/${id}/activate-subscription`);
  return response.data;
};

export const deactivateSubscription = async (id: string): Promise<{ message: string }> => {
  const response = await adminApiClient.post<{ message: string }>(`/admin/users/${id}/deactivate-subscription`);
  return response.data;
};
