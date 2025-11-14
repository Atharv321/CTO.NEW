import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from '../services/authService';

// Mock fetch
global.fetch = vi.fn();

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('should successfully login and store tokens', async () => {
      const mockResponse = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          locations: [],
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result).toEqual(mockResponse);
      expect(localStorage.getItem('auth_tokens')).toBe(JSON.stringify(mockResponse.tokens));
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password',
          }),
        })
      );
    });

    it('should throw error on login failure', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid credentials' }),
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrong-password',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should clear tokens and call logout endpoint', async () => {
      // Set up initial tokens
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      localStorage.setItem('auth_tokens', JSON.stringify(tokens));

      (fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      await authService.logout();

      expect(localStorage.getItem('auth_tokens')).toBeNull();
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/logout',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer access-token',
          }),
        })
      );
    });

    it('should clear tokens even if logout request fails', async () => {
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      localStorage.setItem('auth_tokens', JSON.stringify(tokens));

      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await authService.logout();

      expect(localStorage.getItem('auth_tokens')).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens and update storage', async () => {
      const oldTokens = {
        accessToken: 'old-access-token',
        refreshToken: 'refresh-token',
      };
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      localStorage.setItem('auth_tokens', JSON.stringify(oldTokens));

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newTokens),
      });

      const result = await authService.refreshToken();

      expect(result).toEqual(newTokens);
      expect(localStorage.getItem('auth_tokens')).toBe(JSON.stringify(newTokens));
    });

    it('should throw error if no refresh token available', async () => {
      await expect(authService.refreshToken()).rejects.toThrow('No refresh token available');
    });
  });

  describe('getStoredTokens', () => {
    it('should return tokens from localStorage', () => {
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      localStorage.setItem('auth_tokens', JSON.stringify(tokens));

      const result = authService.getStoredTokens();

      expect(result).toEqual(tokens);
    });

    it('should return null if no tokens in localStorage', () => {
      const result = authService.getStoredTokens();

      expect(result).toBeNull();
    });

    it('should return null if localStorage data is invalid', () => {
      localStorage.setItem('auth_tokens', 'invalid-json');

      const result = authService.getStoredTokens();

      expect(result).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return true for expired token', () => {
      // Create an expired token (exp in the past)
      const expiredPayload = {
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      };
      const expiredToken = `header.${btoa(JSON.stringify(expiredPayload))}.signature`;

      expect(authService.isTokenExpired(expiredToken)).toBe(true);
    });

    it('should return false for valid token', () => {
      // Create a valid token (exp in the future)
      const validPayload = {
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };
      const validToken = `header.${btoa(JSON.stringify(validPayload))}.signature`;

      expect(authService.isTokenExpired(validToken)).toBe(false);
    });

    it('should return true for invalid token', () => {
      expect(authService.isTokenExpired('invalid-token')).toBe(true);
    });
  });

  describe('getValidAccessToken', () => {
    it('should return access token if valid', async () => {
      const tokens = {
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
      };
      localStorage.setItem('auth_tokens', JSON.stringify(tokens));

      vi.spyOn(authService, 'isTokenExpired').mockReturnValue(false);

      const result = await authService.getValidAccessToken();

      expect(result).toBe('valid-token');
    });

    it('should refresh token if access token is expired', async () => {
      const oldTokens = {
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
      };
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      localStorage.setItem('auth_tokens', JSON.stringify(oldTokens));

      vi.spyOn(authService, 'isTokenExpired').mockReturnValue(true);
      vi.spyOn(authService, 'refreshToken').mockResolvedValue(newTokens);

      const result = await authService.getValidAccessToken();

      expect(result).toBe('new-access-token');
    });

    it('should return null if no tokens available', async () => {
      const result = await authService.getValidAccessToken();

      expect(result).toBeNull();
    });
  });
});