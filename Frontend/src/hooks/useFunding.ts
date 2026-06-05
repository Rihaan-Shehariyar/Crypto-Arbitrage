import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInventory, depositFunds } from '@/services/fundingApi';
import type { InventoryResponse, DepositRequest } from '@/types/api';

export function useInventory() {
  return useQuery<InventoryResponse>({
    queryKey: ['inventory'],
    queryFn: getInventory,
  });
}

export function useDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DepositRequest) => depositFunds(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}
