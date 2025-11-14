import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@lib/api-client';
import type { Service } from '@/types';

export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: () => apiClient.get<Service[]>('/services'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useService(id: string) {
  return useQuery({
    queryKey: ['services', id],
    queryFn: () => apiClient.get<Service>(`/services/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
