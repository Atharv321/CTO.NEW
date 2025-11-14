import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, User, AuthTokens } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  switchLocation: (locationId: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; tokens: AuthTokens } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    default:
      return state;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authService.login({ email, password });
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.user, tokens: response.tokens },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authService.register({ email, password, name });
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.user, tokens: response.tokens },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const refreshToken = async () => {
    try {
      const tokens = await authService.refreshToken();
      if (state.user) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: state.user, tokens },
        });
      }
    } catch (error) {
      dispatch({ type: 'LOGOUT' });
      throw error;
    }
  };

  const getCurrentUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      dispatch({ type: 'LOGOUT' });
      throw error;
    }
  };

  const switchLocation = async (locationId: string) => {
    try {
      const updatedUser = await authService.switchLocation(locationId);
      dispatch({ type: 'UPDATE_USER', payload: { currentLocation: updatedUser.currentLocation } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Location switch failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const tokens = authService.getStoredTokens();
      if (tokens) {
        try {
          if (authService.isTokenExpired(tokens.accessToken)) {
            await refreshToken();
          }
          await getCurrentUser();
        } catch (error) {
          console.warn('Session initialization failed:', error);
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    };

    initializeAuth();
  }, []);

  // Set up token refresh timer
  useEffect(() => {
    if (!state.isAuthenticated || !state.tokens) {
      return;
    }

    const checkTokenExpiry = () => {
      if (state.tokens && authService.isTokenExpired(state.tokens.accessToken)) {
        refreshToken().catch(() => {
          // Refresh failed, will be handled by the refreshToken function
        });
      }
    };

    const interval = setInterval(checkTokenExpiry, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [state.isAuthenticated, state.tokens]);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    register,
    refreshToken,
    getCurrentUser,
    switchLocation,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}