import { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Specific API methods
export const suppliersApi = {
  getAll: (filters?: any) => {
    const params = new URLSearchParams(filters);
    return apiClient.get(`/api/suppliers?${params}`);
  },
  getById: (id: string) => apiClient.get(`/api/suppliers/${id}`),
  create: (data: any) => apiClient.post('/api/suppliers', data),
  update: (id: string, data: any) => apiClient.patch(`/api/suppliers/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/suppliers/${id}`),
};

export const purchaseOrdersApi = {
  getAll: (filters?: any) => {
    const params = new URLSearchParams(filters);
    return apiClient.get(`/api/purchase-orders?${params}`);
  },
  getById: (id: string) => apiClient.get(`/api/purchase-orders/${id}`),
  create: (data: any) => apiClient.post('/api/purchase-orders', data),
  update: (id: string, data: any) => apiClient.patch(`/api/purchase-orders/${id}`, data),
  updateStatus: (id: string, status: string) => 
    apiClient.patch(`/api/purchase-orders/${id}/status`, { status }),
  delete: (id: string) => apiClient.delete(`/api/purchase-orders/${id}`),
};

export const notificationsApi = {
  getAll: () => apiClient.get('/api/notifications'),
  markAsRead: (id: string) => apiClient.patch(`/api/notifications/${id}/read`),
  markAllAsRead: () => apiClient.patch('/api/notifications/read-all'),
  delete: (id: string) => apiClient.delete(`/api/notifications/${id}`),
};

export const locationsApi = {
  getAll: () => apiClient.get('/api/locations'),
};

export const exportApi = {
  exportSuppliers: (format: string, filters?: any) => 
    apiClient.post('/api/export/suppliers', { format, filters }),
  exportPurchaseOrders: (format: string, filters?: any) => 
    apiClient.post('/api/export/purchase-orders', { format, filters }),
};