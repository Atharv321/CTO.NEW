export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contactEmail?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  description?: string;
  categoryId: string;
  supplierId?: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockLevel {
  id: string;
  itemId: string;
  locationId: string;
  quantity: number;
  reorderLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryAdjustment {
  id: string;
  itemId: string;
  locationId: string;
  adjustment: number;
  reason: 'scanned_entry' | 'manual_adjustment' | 'correction' | 'count_variance';
  notes?: string;
  adjustedBy: string;
  createdAt: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type UserRole = 'admin' | 'manager' | 'viewer';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}
