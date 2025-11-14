/**
 * Common type definitions for the application
 */

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * User information
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'barber' | 'customer';
  createdAt: string;
  updatedAt: string;
}

/**
 * Barber information
 */
export interface Barber {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty?: string[];
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Customer information
 */
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Booking information
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// User Roles
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff'
}

// Location
export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  isActive: boolean;
}

// Supplier Types
export interface Supplier {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  isActive: boolean;
  leadTimeDays: number;
  minimumOrder: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierContact {
  id: string;
  supplierId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isPrimary: boolean;
}

export interface SupplierProduct {
  id: string;
  supplierId: string;
  productId: string;
  sku: string;
  unitPrice: number;
  minimumOrderQuantity: number;
  leadTimeDays: number;
  isAvailable: boolean;
}

// Purchase Order Types
export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PARTIALLY_RECEIVED = 'partially_received',
  RECEIVED = 'received',
  CANCELLED = 'cancelled'
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  locationId: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  totalAmount: number;
  expectedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity: number;
  notes?: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: Date;
}

export enum NotificationType {
  SUPPLIER_UPDATE = 'supplier_update',
  ORDER_STATUS_CHANGE = 'order_status_change',
  LOW_STOCK = 'low_stock',
  DELIVERY_DELAY = 'delivery_delay'
}

// Filter and Search Types
export interface SupplierFilters {
  search?: string;
  location?: string;
  status?: 'active' | 'inactive';
  rating?: number;
}

export interface PurchaseOrderFilters {
  search?: string;
  status?: PurchaseOrderStatus;
  supplierId?: string;
  locationId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Export Types
export enum ExportFormat {
  CSV = 'csv',
  PDF = 'pdf',
  EXCEL = 'excel'
}

export interface ExportRequest {
  type: 'suppliers' | 'purchase_orders';
  format: ExportFormat;
  filters?: SupplierFilters | PurchaseOrderFilters;
}
  role: 'customer' | 'barber' | 'admin';
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
}

export interface Barber {
  id: string;
  name: string;
  email: string;
  specialties: string[];
  avatar?: string;
}

export interface Booking {
  id: string;
  customerId: string;
  barberId: string;
  date: string;
  startTime: string;
  endTime: string;
  service: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  serviceId: string;
  date: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

// Inventory Types
export interface Category {
  id: number | string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryLocation {
  id: number | string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryItem {
  id: number | string;
  sku: string;
  barcode: string;
  name: string;
  description?: string;
  categoryId: number | string;
  supplierId?: number | string;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockLevel {
  id: number | string;
  itemId: number | string;
  locationId: number | string;
  quantity: number;
  reorderLevel?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockMovement {
  id: number | string;
  itemId: number | string;
  locationId: number | string;
  quantity: number;
  movementType: 'inbound' | 'outbound' | 'adjustment' | 'scanned_entry' | 'return';
  notes?: string;
  referenceId?: string;
  adjustedBy?: string;
  createdAt?: string;
  timestamp?: string;
}

export interface AuditLog {
  id: number | string;
  itemId: number | string;
  locationId: number | string;
  action: 'adjustment' | 'movement' | 'transfer';
  quantity: number;
  movementType?: string;
  notes?: string;
  adjustedBy?: string;
  userId?: string;
  createdAt?: string;
  timestamp?: string;
}

export interface InventoryItemFilters {
  search?: string;
  categoryId?: number | string;
  supplierId?: number | string;
  locationId?: number | string;
}

export interface StockMovementRequest {
  quantity: number;
  movementType: 'inbound' | 'outbound' | 'adjustment' | 'scanned_entry' | 'return';
  notes?: string;
  referenceId?: string;
}
