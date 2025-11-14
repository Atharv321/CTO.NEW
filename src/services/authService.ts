import {
  LoginCredentials,
  RegisterData,
  PasswordResetRequest,
  PasswordResetData,
  AuthResponse,
  AuthTokens,
  User,
} from '../types/auth';

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

class AuthService {
  private getHeaders(): Record<string, string> {
    const tokens = this.getStoredTokens();
    return {
      'Content-Type': 'application/json',
      ...(tokens?.accessToken && { Authorization: `Bearer ${tokens.accessToken}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const authResponse = await this.handleResponse<AuthResponse>(response);
    this.storeTokens(authResponse.tokens);
    return authResponse;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const authResponse = await this.handleResponse<AuthResponse>(response);
    this.storeTokens(authResponse.tokens);
    return authResponse;
  }

  async logout(): Promise<void> {
    const tokens = this.getStoredTokens();
    if (tokens?.accessToken) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: this.getHeaders(),
        });
      } catch (error) {
        console.warn('Logout request failed:', error);
      }
    }
    this.clearTokens();
  }

  async refreshToken(): Promise<AuthTokens> {
    const tokens = this.getStoredTokens();
    if (!tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    const newTokens = await this.handleResponse<AuthTokens>(response);
    this.storeTokens(newTokens);
    return newTokens;
  }

  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/auth/password-reset-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    await this.handleResponse<void>(response);
  }

  async resetPassword(data: PasswordResetData): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/auth/password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    await this.handleResponse<void>(response);
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<User>(response);
  }

  async switchLocation(locationId: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/auth/switch-location`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ locationId }),
    });

    return this.handleResponse<User>(response);
  }

  getStoredTokens(): AuthTokens | null {
    try {
      const tokensJson = localStorage.getItem('auth_tokens');
      return tokensJson ? JSON.parse(tokensJson) : null;
    } catch {
      return null;
    }
  }

  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem('auth_tokens', JSON.stringify(tokens));
  }

  clearTokens(): void {
    localStorage.removeItem('auth_tokens');
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  async getValidAccessToken(): Promise<string | null> {
    const tokens = this.getStoredTokens();
    if (!tokens?.accessToken) {
      return null;
    }

    if (this.isTokenExpired(tokens.accessToken)) {
      try {
        const newTokens = await this.refreshToken();
        return newTokens.accessToken;
      } catch {
        this.clearTokens();
        return null;
      }
    }

    return tokens.accessToken;
  }
}

export const authService = new AuthService();