import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { MantineColorScheme } from '@mantine/core';

interface ThemeState {
  colorScheme: MantineColorScheme;
  toggleColorScheme: () => void;
  setColorScheme: (scheme: MantineColorScheme) => void;
}

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      set => ({
        colorScheme: 'light',
        toggleColorScheme: () =>
          set(
            state => ({ colorScheme: state.colorScheme === 'dark' ? 'light' : 'dark' }),
            false,
            'theme/toggleColorScheme'
          ),
        setColorScheme: scheme => set({ colorScheme: scheme }, false, 'theme/setColorScheme'),
      }),
      {
        name: 'theme-preferences',
      }
    )
  )
);
