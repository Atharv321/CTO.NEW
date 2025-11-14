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

// Alerting Types
export interface AlertEvent {
  id: string;
  type: AlertEventType;
  severity: AlertSeverity;
  title: string;
  message: string;
  data: any;
  userId?: string;
  locationId?: string;
  productId?: string;
  createdAt: Date;
  processedAt?: Date;
}

export enum AlertEventType {
  LOW_STOCK = 'low_stock',
  IMPENDING_EXPIRATION = 'impending_expiration',
  SUPPLIER_ORDER_UPDATE = 'supplier_order_update',
  SYSTEM_ERROR = 'system_error'
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface NotificationChannel {
  type: NotificationChannelType;
  enabled: boolean;
  config: any;
}

export enum NotificationChannelType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app'
}

export interface UserNotificationPreference {
  id: string;
  userId: string;
  alertTypes: AlertEventType[];
  channels: NotificationChannel[];
  minSeverity: AlertSeverity;
  quietHours?: {
    start: string; // HH:mm
    end: string;   // HH:mm
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  alertEventId: string;
  channelType: NotificationChannelType;
  status: NotificationStatus;
  sentAt?: Date;
  error?: string;
  retryCount: number;
  createdAt: Date;
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  RETRYING = 'retrying'
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  read: boolean;
  createdAt: Date;
  readAt?: Date;
}

export interface AlertThreshold {
  id: string;
  locationId?: string;
  productId?: string;
  type: AlertEventType;
  threshold: number;
  unit: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
