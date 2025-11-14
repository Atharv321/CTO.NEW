import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { useThemeStore } from '@store/ui/themeStore';
import { useAuthStore } from '@store/authStore';
import { queryClient } from '@app/providers/queryClient';

afterEach(() => {
  cleanup();
  queryClient.clear();
  localStorage.clear();
  sessionStorage.clear();
  useThemeStore.setState({ colorScheme: 'light' });
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
});
