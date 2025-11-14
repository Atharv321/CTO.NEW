import axios, { AxiosInstance } from 'axios';
import {
  Service,
  Barber,
  TimeSlot,
  BookingFormData,
  BookingConfirmation,
  ApiError,
} from '@types/booking';
import { DashboardData } from '@types/dashboard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const apiError: ApiError = {
          message: error.response?.data?.message || error.message || 'An error occurred',
          code: error.response?.status,
          details: error.response?.data,
        };
        return Promise.reject(apiError);
      }
    );
  }

  // Services
  async getServices(): Promise<Service[]> {
    const response = await this.client.get('/services');
    return response.data;
  }

  async getServiceById(id: string): Promise<Service> {
    const response = await this.client.get(`/services/${id}`);
    return response.data;
  }

  // Barbers
  async getBarbers(): Promise<Barber[]> {
    const response = await this.client.get('/barbers');
    return response.data;
  }

  async getBarberById(id: string): Promise<Barber> {
    const response = await this.client.get(`/barbers/${id}`);
    return response.data;
  }

  // Time Slots
  async getAvailableSlots(barberId: string, date: string): Promise<TimeSlot[]> {
    const response = await this.client.get(`/time-slots/available`, {
      params: { barberId, date },
    });
    return response.data;
  }

  // Booking
  async createBooking(data: BookingFormData): Promise<BookingConfirmation> {
    const response = await this.client.post('/bookings', data);
    return response.data;
  }

  async getBooking(bookingId: string): Promise<BookingConfirmation> {
    const response = await this.client.get(`/bookings/${bookingId}`);
    return response.data;
  }

  async cancelBooking(bookingId: string): Promise<void> {
    await this.client.delete(`/bookings/${bookingId}`);
  }

  // Analytics / Dashboard
  async getDashboardData(): Promise<DashboardData> {
    const response = await this.client.get('/analytics/dashboard');
    return response.data;
  }
}

export const apiClient = new ApiClient();
