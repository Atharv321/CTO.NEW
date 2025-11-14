import axios, { AxiosInstance } from 'axios';
import {
  AdminUser,
  LoginCredentials,
  LoginResponse,
  ServiceFormData,
  BarberFormData,
  AvailabilitySlot,
  AvailabilityCalendar,
  BookingWithDetails,
  BookingFilters,
  PaginatedResponse,
} from '@types/admin';
import { Service, Barber, ApiError } from '@types/booking';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class AdminApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/admin`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('admin_token');
      if (this.token) {
        this.setAuthHeader(this.token);
      }
    }

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearAuth();
        }
        const apiError: ApiError = {
          message: error.response?.data?.message || error.message || 'An error occurred',
          code: error.response?.status?.toString(),
          details: error.response?.data,
        };
        return Promise.reject(apiError);
      }
    );
  }

  private setAuthHeader(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  private clearAuth() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    }
    delete this.client.defaults.headers.common['Authorization'];
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await this.client.post('/auth/login', credentials);
    const { token, user, expiresAt } = response.data;
    
    this.token = token;
    this.setAuthHeader(token);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_user', JSON.stringify(user));
    }
    
    return { token, user, expiresAt };
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } finally {
      this.clearAuth();
    }
  }

  async getCurrentUser(): Promise<AdminUser> {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Services Management
  async getServices(): Promise<Service[]> {
    const response = await this.client.get('/services');
    return response.data;
  }

  async getServiceById(id: string): Promise<Service> {
    const response = await this.client.get(`/services/${id}`);
    return response.data;
  }

  async createService(data: ServiceFormData): Promise<Service> {
    const response = await this.client.post('/services', data);
    return response.data;
  }

  async updateService(id: string, data: ServiceFormData): Promise<Service> {
    const response = await this.client.put(`/services/${id}`, data);
    return response.data;
  }

  async deleteService(id: string): Promise<void> {
    await this.client.delete(`/services/${id}`);
  }

  // Barbers Management
  async getBarbers(): Promise<Barber[]> {
    const response = await this.client.get('/barbers');
    return response.data;
  }

  async getBarberById(id: string): Promise<Barber> {
    const response = await this.client.get(`/barbers/${id}`);
    return response.data;
  }

  async createBarber(data: BarberFormData): Promise<Barber> {
    const response = await this.client.post('/barbers', data);
    return response.data;
  }

  async updateBarber(id: string, data: BarberFormData): Promise<Barber> {
    const response = await this.client.put(`/barbers/${id}`, data);
    return response.data;
  }

  async deleteBarber(id: string): Promise<void> {
    await this.client.delete(`/barbers/${id}`);
  }

  // Availability Calendar Management
  async getAvailabilityCalendars(): Promise<AvailabilityCalendar[]> {
    const response = await this.client.get('/availability');
    return response.data;
  }

  async getBarberAvailability(barberId: string): Promise<AvailabilityCalendar> {
    const response = await this.client.get(`/availability/${barberId}`);
    return response.data;
  }

  async updateBarberAvailability(
    barberId: string,
    slots: AvailabilitySlot[]
  ): Promise<AvailabilityCalendar> {
    const response = await this.client.put(`/availability/${barberId}`, { slots });
    return response.data;
  }

  async createAvailabilitySlot(
    barberId: string,
    slot: Omit<AvailabilitySlot, 'id' | 'barberId'>
  ): Promise<AvailabilitySlot> {
    const response = await this.client.post(`/availability/${barberId}/slots`, slot);
    return response.data;
  }

  async deleteAvailabilitySlot(barberId: string, slotId: string): Promise<void> {
    await this.client.delete(`/availability/${barberId}/slots/${slotId}`);
  }

  // Bookings Management
  async getBookings(filters?: BookingFilters): Promise<PaginatedResponse<BookingWithDetails>> {
    const response = await this.client.get('/bookings', {
      params: filters,
    });
    return response.data;
  }

  async getBookingById(bookingId: string): Promise<BookingWithDetails> {
    const response = await this.client.get(`/bookings/${bookingId}`);
    return response.data;
  }

  async updateBookingStatus(
    bookingId: string,
    status: 'confirmed' | 'cancelled' | 'completed'
  ): Promise<BookingWithDetails> {
    const response = await this.client.patch(`/bookings/${bookingId}/status`, { status });
    return response.data;
  }
}

export const adminApiClient = new AdminApiClient();
