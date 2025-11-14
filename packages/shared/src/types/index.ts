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
