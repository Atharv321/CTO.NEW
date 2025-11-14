import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRequireAuth, useRequireRole } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { AuthProvider } from '../contexts/AuthContext';
import React from 'react';

vi.mock('../services/authService');

const mockAuthService = vi.mocked(authService);

const wrapper = ({ children }: { children: React.ReactNode }) => (
  React.createElement(AuthProvider, null, children)
);

describe('Auth Hooks', () => {
  let originalLocation: Location;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as Location;
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  describe('useRequireAuth', () => {
    it('should return authenticated state when user is authenticated', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const,
        locations: [],
      };

      mockAuthService.getStoredTokens.mockReturnValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });
      mockAuthService.isTokenExpired.mockReturnValue(false);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useRequireAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual(mockUser);
      });
    });

    it('should redirect to login when not authenticated', async () => {
      mockAuthService.getStoredTokens.mockReturnValue(null);

      const { result } = renderHook(() => useRequireAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(window.location.href).toBe('/login');
      });
    });

    it('should not redirect while loading', () => {
      mockAuthService.getStoredTokens.mockReturnValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });
      mockAuthService.isTokenExpired.mockReturnValue(false);
      mockAuthService.getCurrentUser.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useRequireAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(window.location.href).toBe('');
    });
  });

  describe('useRequireRole', () => {
    it('should allow access when user has required role', async () => {
      const mockUser = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin' as const,
        locations: [],
      };

      mockAuthService.getStoredTokens.mockReturnValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });
      mockAuthService.isTokenExpired.mockReturnValue(false);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useRequireRole('admin'), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.hasAccess).toBe(true);
        expect(result.current.user).toEqual(mockUser);
      });
    });

    it('should allow admin to access manager routes', async () => {
      const mockUser = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin' as const,
        locations: [],
      };

      mockAuthService.getStoredTokens.mockReturnValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });
      mockAuthService.isTokenExpired.mockReturnValue(false);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useRequireRole('manager'), { wrapper });

      await waitFor(() => {
        expect(result.current.hasAccess).toBe(true);
      });
    });

    it('should allow admin to access user routes', async () => {
      const mockUser = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin' as const,
        locations: [],
      };

      mockAuthService.getStoredTokens.mockReturnValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });
      mockAuthService.isTokenExpired.mockReturnValue(false);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useRequireRole('user'), { wrapper });

      await waitFor(() => {
        expect(result.current.hasAccess).toBe(true);
      });
    });

    it('should allow manager to access user routes', async () => {
      const mockUser = {
        id: '1',
        email: 'manager@example.com',
        name: 'Manager User',
        role: 'manager' as const,
        locations: [],
      };

      mockAuthService.getStoredTokens.mockReturnValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });
      mockAuthService.isTokenExpired.mockReturnValue(false);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useRequireRole('user'), { wrapper });

      await waitFor(() => {
        expect(result.current.hasAccess).toBe(true);
      });
    });

    it('should redirect to unauthorized when user lacks required role', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user' as const,
        locations: [],
      };

      mockAuthService.getStoredTokens.mockReturnValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });
      mockAuthService.isTokenExpired.mockReturnValue(false);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useRequireRole('admin'), { wrapper });

      await waitFor(() => {
        expect(result.current.hasAccess).toBe(false);
        expect(window.location.href).toBe('/unauthorized');
      });
    });

    it('should redirect user to unauthorized when accessing manager routes', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user' as const,
        locations: [],
      };

      mockAuthService.getStoredTokens.mockReturnValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });
      mockAuthService.isTokenExpired.mockReturnValue(false);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useRequireRole('manager'), { wrapper });

      await waitFor(() => {
        expect(result.current.hasAccess).toBe(false);
        expect(window.location.href).toBe('/unauthorized');
      });
    });

    it('should redirect to login when not authenticated', async () => {
      mockAuthService.getStoredTokens.mockReturnValue(null);

      const { result } = renderHook(() => useRequireRole('user'), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(window.location.href).toBe('/login');
      });
    });

    it('should return false for hasAccess when user is null', async () => {
      mockAuthService.getStoredTokens.mockReturnValue(null);

      const { result } = renderHook(() => useRequireRole('user'), { wrapper });

      await waitFor(() => {
        expect(result.current.hasAccess).toBe(false);
      });
    });
  });
});
