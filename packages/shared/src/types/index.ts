export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  ANALYST = 'analyst',
  STAFF = 'staff'
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
// Inventory Types
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  cost: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
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
export interface InventoryItem {
  id: string;
  productId: string;
  locationId: string;
  quantity: number;
  lastUpdated: Date;
}

export interface StockMovement {
  id: string;
  productId: string;
  locationId: string;
  quantity: number;
  type: 'in' | 'out' | 'adjustment' | 'waste';
  reason: string;
  createdAt: Date;
}

// Analytics Types
export interface InventoryValuation {
  locationId: string;
  locationName: string;
  totalValue: number;
  totalItems: number;
  categoryBreakdown: CategoryValuation[];
  date: string;
}

export interface CategoryValuation {
  category: string;
  value: number;
  itemCount: number;
  percentage: number;
}

export interface InventoryTurnover {
  period: string;
  locationId: string;
  locationName: string;
  turnoverRatio: number;
  daysOfSupply: number;
  costOfGoodsSold: number;
  averageInventory: number;
}

export interface WastageReport {
  period: string;
  locationId: string;
  locationName: string;
  totalWastage: number;
  wastageValue: number;
  wastagePercentage: number;
  topWastedItems: WastedItem[];
}

export interface WastedItem {
  productId: string;
  productName: string;
  quantity: number;
  value: number;
  reason: string;
}

export interface LocationPerformance {
  locationId: string;
  locationName: string;
  period: string;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  grossMargin: number;
  inventoryTurnover: number;
  wastagePercentage: number;
}

export interface AnalyticsFilters {
  locationIds?: string[];
  startDate?: string;
  endDate?: string;
  period?: 'daily' | 'weekly' | 'monthly';
  category?: string;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string;
  borderColor?: string;
}

// Report Types
export interface ReportDefinition {
  id: string;
  name: string;
  type: 'valuation' | 'turnover' | 'wastage' | 'performance';
  schedule?: string;
  filters?: AnalyticsFilters;
  isActive: boolean;
  createdAt: Date;
}

export interface ReportRun {
  id: string;
  reportDefinitionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  data?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}
