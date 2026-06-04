import { useQuery } from '@tanstack/react-query';
import { 
  getAdminStats, 
  getAdminSystem, 
  getAdminUsers, 
  getAdminUser, 
  getAdminUserTrades 
} from '@/services/adminEndpoints';

export function useAdminStats() {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: getAdminStats,
  });
}

export function useAdminSystem() {
  return useQuery({
    queryKey: ['adminSystem'],
    queryFn: getAdminSystem,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['adminUsers'],
    queryFn: getAdminUsers,
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: ['adminUser', id],
    queryFn: () => getAdminUser(id),
    enabled: !!id,
  });
}

export function useAdminUserTrades(id: string) {
  return useQuery({
    queryKey: ['adminUserTrades', id],
    queryFn: () => getAdminUserTrades(id),
    enabled: !!id,
  });
}
