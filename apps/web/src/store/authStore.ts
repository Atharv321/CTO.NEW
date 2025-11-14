import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      set => ({
        user: null,
        token: null,
        isAuthenticated: false,
        setUser: user =>
          set({ user, isAuthenticated: user !== null }, false, 'auth/setUser'),
        setToken: token => set({ token }, false, 'auth/setToken'),
        logout: () =>
          set({ user: null, token: null, isAuthenticated: false }, false, 'auth/logout'),
      }),
      {
        name: 'auth-storage',
        partialize: state => ({ token: state.token }),
      }
    )
  )
);
