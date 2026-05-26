import { apiClient } from './api';
import type {
  DepositRequest,
  PortfolioResponse,
  InventoryResponse,
  Trade,
  LoginResponse,
  UserProfile,
} from "@/types/api";

export const login = async (credentials: Record<string, string>): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/login', credentials);
  return response.data;
};

export const register = async (userData: Record<string, string>): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/register', userData);
  return response.data;
};

export const getMe = async (): Promise<UserProfile> => {
  const response = await apiClient.get<UserProfile>('/me');
  return response.data;
};

export const getPortfolio = async (): Promise<PortfolioResponse> => {
  const response = await apiClient.get<PortfolioResponse>('/portfolio');
  return response.data;
};

export const getInventory = async (): Promise<InventoryResponse> => {
  const response = await apiClient.get<InventoryResponse>('/inventory');
  return response.data;
};

export const deposit = async (data: DepositRequest): Promise<void> => {
  await apiClient.post('/deposit', data);
};

export const getTrades = async (): Promise<Trade[]> => {
  const response = await apiClient.get<Trade[]>('/trades');
  return response.data;
};

export const startTrading = async (): Promise<{message: string}> => {
  const response = await apiClient.post<{message: string}>('/trading/start');
  return response.data;
};

export const stopTrading = async (): Promise<{message: string}> => {
  const response = await apiClient.post<{message: string}>('/trading/stop');
  return response.data;
};

export const getRiskMetrics =
	async () => {

		const res =
			await apiClient.get('/risk')

		return res.data
	}
