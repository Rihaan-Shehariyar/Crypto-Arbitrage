import { apiClient } from './api';
import type { InventoryResponse, DepositRequest } from '@/types/api';

export const getInventory = async (): Promise<InventoryResponse> => {
  const response = await apiClient.get<InventoryResponse>('/inventory');
  return response.data;
};

export const depositFunds = async (data: DepositRequest): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/deposit', data);
  return response.data;
};
