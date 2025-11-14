import {
  InventoryItem,
  Category,
  InventoryLocation,
  StockLevel,
  StockMovement,
  AuditLog,
  PaginatedResponse,
  InventoryItemFilters,
  StockMovementRequest,
} from '@/types';
import { fetchData, postData, putData } from '@/lib/api';

const API_BASE = '/api';

// Items API
export const inventoryService = {
  // Items
  async getItems(
    page: number = 1,
    limit: number = 10,
    filters?: InventoryItemFilters
  ): Promise<PaginatedResponse<InventoryItem>> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (filters?.search) params.append('search', filters.search);
    if (filters?.categoryId) params.append('category_id', String(filters.categoryId));
    if (filters?.supplierId) params.append('supplier_id', String(filters.supplierId));
    if (filters?.locationId) params.append('location_id', String(filters.locationId));

    const response: any = await fetchData(
      `${API_BASE}/items?${params.toString()}`
    );

    return {
      items: response.data || [],
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      limit: response.pagination?.limit || 10,
      hasMore: (response.pagination?.page || 1) < (response.pagination?.pages || 1),
    };
  },

  async getItemById(id: number | string): Promise<InventoryItem> {
    return fetchData(`${API_BASE}/items/${id}`);
  },

  async getItemByBarcode(barcode: string): Promise<InventoryItem> {
    return fetchData(`${API_BASE}/items/barcode/${barcode}`);
  },

  async getItemBySku(sku: string): Promise<InventoryItem> {
    return fetchData(`${API_BASE}/items/sku/${sku}`);
  },

  async searchItems(query: string): Promise<InventoryItem[]> {
    const response: any = await fetchData(`${API_BASE}/items/search/${query}`);
    return response.data || response || [];
  },

  async createItem(data: Partial<InventoryItem>): Promise<InventoryItem> {
    return postData(`${API_BASE}/items`, data);
  },

  async updateItem(
    id: number | string,
    data: Partial<InventoryItem>
  ): Promise<InventoryItem> {
    return putData(`${API_BASE}/items/${id}`, data);
  },

  // Categories
  async getCategories(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Category>> {
    const response: any = await fetchData(
      `${API_BASE}/categories?page=${page}&limit=${limit}`
    );

    return {
      items: response.data || [],
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      limit: response.pagination?.limit || 10,
      hasMore: (response.pagination?.page || 1) < (response.pagination?.pages || 1),
    };
  },

  async getCategoryById(id: number | string): Promise<Category> {
    return fetchData(`${API_BASE}/categories/${id}`);
  },

  // Locations
  async getLocations(page: number = 1, limit: number = 10): Promise<PaginatedResponse<InventoryLocation>> {
    const response: any = await fetchData(
      `${API_BASE}/locations?page=${page}&limit=${limit}`
    );

    return {
      items: response.data || [],
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      limit: response.pagination?.limit || 10,
      hasMore: (response.pagination?.page || 1) < (response.pagination?.pages || 1),
    };
  },

  async getLocationById(id: number | string): Promise<InventoryLocation> {
    return fetchData(`${API_BASE}/locations/${id}`);
  },

  // Stock
  async getStockByItem(itemId: number | string): Promise<StockLevel[]> {
    const response: any = await fetchData(`${API_BASE}/stock/item/${itemId}`);
    return response.data || response || [];
  },

  async getStockLevel(
    itemId: number | string,
    locationId: number | string
  ): Promise<StockLevel> {
    return fetchData(`${API_BASE}/stock/${itemId}/${locationId}`);
  },

  async getStockByLocation(
    locationId: number | string,
    page: number = 1,
    limit: number = 10,
    filters?: { search?: string; below_reorder?: boolean }
  ): Promise<PaginatedResponse<StockLevel>> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (filters?.search) params.append('search', filters.search);
    if (filters?.below_reorder) params.append('below_reorder', 'true');

    const response: any = await fetchData(
      `${API_BASE}/stock/location/${locationId}?${params.toString()}`
    );

    return {
      items: response.data || [],
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      limit: response.pagination?.limit || 10,
      hasMore: (response.pagination?.page || 1) < (response.pagination?.pages || 1),
    };
  },

  async getLocationSummary(locationId: number | string): Promise<any> {
    return fetchData(`${API_BASE}/stock/location/${locationId}/summary`);
  },

  async adjustStock(
    itemId: number | string,
    locationId: number | string,
    data: StockMovementRequest
  ): Promise<StockMovement> {
    return postData(`${API_BASE}/stock/${itemId}/${locationId}/adjust`, data);
  },

  async initializeStock(
    itemId: number | string,
    locationId: number | string,
    quantity: number
  ): Promise<StockLevel> {
    return postData(`${API_BASE}/stock/${itemId}/${locationId}/init`, { quantity });
  },

  async getStockMovementHistory(
    itemId: number | string,
    locationId: number | string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<StockMovement>> {
    const response: any = await fetchData(
      `${API_BASE}/stock/${itemId}/${locationId}/history?page=${page}&limit=${limit}`
    );

    return {
      items: response.data || response || [],
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      limit: response.pagination?.limit || 10,
      hasMore: false,
    };
  },

  // Suppliers
  async getSuppliers(page: number = 1, limit: number = 10): Promise<PaginatedResponse<any>> {
    const response: any = await fetchData(
      `${API_BASE}/suppliers?page=${page}&limit=${limit}`
    );

    return {
      items: response.data || [],
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      limit: response.pagination?.limit || 10,
      hasMore: (response.pagination?.page || 1) < (response.pagination?.pages || 1),
    };
  },

  async getSupplierById(id: number | string): Promise<any> {
    return fetchData(`${API_BASE}/suppliers/${id}`);
  },
};
