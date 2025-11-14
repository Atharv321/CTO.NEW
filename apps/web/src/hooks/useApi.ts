import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { fetchData, postData, putData, deleteData, ApiError } from '@/lib/api';

/**
 * Hook for fetching data
 */
export function useFetch<T>(
  url: string | null,
  options?: Omit<UseQueryOptions<T, ApiError>, 'queryKey' | 'queryFn'>
): UseQueryResult<T, ApiError> {
  return useQuery<T, ApiError>({
    queryKey: [url],
    queryFn: () => fetchData<T>(url!),
    enabled: !!url,
    ...options,
  });
}

/**
 * Hook for creating/posting data
 */
export function useCreate<T, V>(
  options?: Omit<UseMutationOptions<T, ApiError, { url: string; data: V }>, 'mutationFn'>
): UseMutationResult<T, ApiError, { url: string; data: V }> {
  return useMutation<T, ApiError, { url: string; data: V }>({
    mutationFn: ({ url, data }) => postData<T>(url, data),
    ...options,
  });
}

/**
 * Hook for updating data
 */
export function useUpdate<T, V>(
  options?: Omit<UseMutationOptions<T, ApiError, { url: string; data: V }>, 'mutationFn'>
): UseMutationResult<T, ApiError, { url: string; data: V }> {
  return useMutation<T, ApiError, { url: string; data: V }>({
    mutationFn: ({ url, data }) => putData<T>(url, data),
    ...options,
  });
}

/**
 * Hook for deleting data
 */
export function useDelete<T>(
  options?: Omit<UseMutationOptions<T, ApiError, string>, 'mutationFn'>
): UseMutationResult<T, ApiError, string> {
  return useMutation<T, ApiError, string>({
    mutationFn: (url) => deleteData<T>(url),
    ...options,
  });
}
