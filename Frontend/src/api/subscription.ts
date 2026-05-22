import { apiClient } from '@/services/api';

export interface SubscriptionActivationResponse {
success: boolean

	message: string

	transaction_id: string

	subscription_active: boolean
}

export async function activateSubscription(): Promise<SubscriptionActivationResponse> {
  const response = await apiClient.post<SubscriptionActivationResponse>('/subscription/activate');
  return response.data;
}
