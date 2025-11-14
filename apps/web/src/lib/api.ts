import axios, { AxiosInstance, AxiosError } from 'axios';
import { env } from '@/config/env';

/**
 * API Error Type
 */
export interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}

/**
 * Create and configure axios instance
 */
const createApiClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: env.API_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response) {
        // Server responded with error status
        const apiError: ApiError = {
          message: error.message,
          status: error.response.status,
          data: error.response.data,
        };
        return Promise.reject(apiError);
      } else if (error.request) {
        // Request made but no response received
        const apiError: ApiError = {
          message: 'No response from server',
          status: undefined,
          data: error.request,
        };
        return Promise.reject(apiError);
      } else {
        // Error in request setup
        const apiError: ApiError = {
          message: error.message,
          status: undefined,
        };
        return Promise.reject(apiError);
      }
    }
  );

  return instance;
};

export const apiClient = createApiClient();

/**
 * Generic fetch function with proper typing
 */
export async function fetchData<T>(
  url: string,
  config = {}
): Promise<T> {
  const response = await apiClient.get<T>(url, config);
  return response.data;
}

/**
 * Generic post function with proper typing
 */
export async function postData<T>(
  url: string,
  data: unknown,
  config = {}
): Promise<T> {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
}

/**
 * Generic put function with proper typing
 */
export async function putData<T>(
  url: string,
  data: unknown,
  config = {}
): Promise<T> {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
}

/**
 * Generic delete function with proper typing
 */
export async function deleteData<T>(
  url: string,
  config = {}
): Promise<T> {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
}
