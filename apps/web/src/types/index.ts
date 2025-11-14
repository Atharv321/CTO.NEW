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
}
