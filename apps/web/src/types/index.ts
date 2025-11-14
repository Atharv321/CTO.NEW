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
