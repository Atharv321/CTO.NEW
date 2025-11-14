import { Service, Barber } from './booking';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AdminUser;
  token: string;
  expiresAt: string;
}

export interface ServiceFormData {
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  icon?: string;
}

export interface BarberFormData {
  name: string;
  rating: number;
  avatar?: string;
  bio?: string;
}

export interface AvailabilitySlot {
  id: string;
  barberId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isActive: boolean;
}

export interface AvailabilityCalendar {
  id: string;
  barberId: string;
  barberName?: string;
  slots: AvailabilitySlot[];
}

export interface BookingWithDetails {
  bookingId: string;
  serviceId: string;
  serviceName: string;
  barberId: string;
  barberName: string;
  scheduledTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  createdAt: string;
}

export interface BookingFilters {
  status?: string;
  barberId?: string;
  serviceId?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
