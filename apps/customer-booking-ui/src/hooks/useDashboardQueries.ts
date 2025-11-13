import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@lib/api-client';
import { mockDashboardData } from '@lib/mock-dashboard-data';
import { DashboardData } from '@types/dashboard';

const QUERY_KEYS = {
  dashboard: ['dashboard'],
};

export function useDashboard() {
  return useQuery<DashboardData, Error>({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: () => apiClient.getDashboardData(),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 10,
    placeholderData: () => mockDashboardData,
  });
}
