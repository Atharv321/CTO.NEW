import { create } from 'zustand';

/**
 * Auth state type
 */
interface AuthState {
  isAuthenticated: boolean;
  user: { id: string; name: string; email: string } | null;
  
  // Actions
  login: (user: AuthState['user']) => void;
  logout: () => void;
  setUser: (user: AuthState['user']) => void;
}

/**
 * Auth store using Zustand
 * Manages user authentication state
 */
export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  
  login: (user) => set({
    isAuthenticated: true,
    user,
  }),
  
  logout: () => set({
    isAuthenticated: false,
    user: null,
  }),
  
  setUser: (user) => set({ user }),
}));
