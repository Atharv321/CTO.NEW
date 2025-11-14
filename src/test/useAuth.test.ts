import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRequireAuth, useRequireRole } from '../hooks/useAuth';
import { AuthProvider } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { act } from 'react';

// Mock the authService
vi.mock('../services/authService');

const mockAuthService = vi.mocked(authService);

// Mock window.location
const mockLocation = {
  href: '',
  assign: vi.fn(),
  replace: vi.fn(),
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('useRequireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
    mockAuthService.getStoredTokens.mockReturnValue(null);
  });

  it('should redirect to login when not authenticated', async () => {
    const { result } = renderHook(() => useRequireAuth(), {
      wrapper: AuthProvider,
    });

    // Wait for initial loading to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(result.current.isAuthenticated).toBe(false);
    expect(mockLocation.href).toBe('/login');
  });

  it('should not redirect when authenticated', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      locations: [],
    };
    const mockTokens = {
      accessToken: 'valid-token',
      refreshToken: 'refresh-token',
    };

    mockAuthService.getStoredTokens.mockReturnValue(mockTokens);
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useRequireAuth(), {
      wrapper: AuthProvider,
    });

    // Wait for auth to initialize
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(result.current.isAuthenticated).toBe(true);
    expect(mockLocation.href).toBe('');
  });
});

describe('useRequireRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
    mockAuthService.getStoredTokens.mockReturnValue(null);
  });

  it('should redirect to login when not authenticated', async () => {
    const { result } = renderHook(() => useRequireRole('admin'), {
      wrapper: AuthProvider,
    });

    // Wait for initial loading to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.hasAccess).toBe(false);
    expect(mockLocation.href).toBe('/login');
  });

  it('should allow access when user has required role', async () => {
    const mockUser = {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin' as const,
      locations: [],
    };
    const mockTokens = {
      accessToken: 'valid-token',
      refreshToken: 'refresh-token',
    };

    mockAuthService.getStoredTokens.mockReturnValue(mockTokens);
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useRequireRole('admin'), {
      wrapper: AuthProvider,
    });

    // Wait for auth to initialize
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.hasAccess).toBe(true);
    expect(mockLocation.href).toBe('');
  });

  it('should allow access when user has higher role than required', async () => {
    const mockUser = {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin' as const,
      locations: [],
    };
    const mockTokens = {
      accessToken: 'valid-token',
      refreshToken: 'refresh-token',
    };

    mockAuthService.getStoredTokens.mockReturnValue(mockTokens);
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useRequireRole('user'), {
      wrapper: AuthProvider,
    });

    // Wait for auth to initialize
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.hasAccess).toBe(true);
    expect(mockLocation.href).toBe('');
  });

  it('should redirect to unauthorized when user has insufficient role', async () => {
    const mockUser = {
      id: '1',
      email: 'user@example.com',
      name: 'Regular User',
      role: 'user' as const,
      locations: [],
    };
    const mockTokens = {
      accessToken: 'valid-token',
      refreshToken: 'refresh-token',
    };

    mockAuthService.getStoredTokens.mockReturnValue(mockTokens);
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useRequireRole('admin'), {
      wrapper: AuthProvider,
    });

    // Wait for auth to initialize
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.hasAccess).toBe(false);
    expect(mockLocation.href).toBe('/unauthorized');
  });

  it('should allow manager to access user-level routes', async () => {
    const mockUser = {
      id: '1',
      email: 'manager@example.com',
      name: 'Manager User',
      role: 'manager' as const,
      locations: [],
    };
    const mockTokens = {
      accessToken: 'valid-token',
      refreshToken: 'refresh-token',
    };

    mockAuthService.getStoredTokens.mockReturnValue(mockTokens);
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useRequireRole('user'), {
      wrapper: AuthProvider,
    });

    // Wait for auth to initialize
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.hasAccess).toBe(true);
    expect(mockLocation.href).toBe('');
  });

  it('should allow admin to access manager-level routes', async () => {
    const mockUser = {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin' as const,
      locations: [],
    };
    const mockTokens = {
      accessToken: 'valid-token',
      refreshToken: 'refresh-token',
    };

    mockAuthService.getStoredTokens.mockReturnValue(mockTokens);
    mockAuthService.isTokenExpired.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useRequireRole('manager'), {
      wrapper: AuthProvider,
    });

    // Wait for auth to initialize
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.hasAccess).toBe(true);
    expect(mockLocation.href).toBe('');
  });
});