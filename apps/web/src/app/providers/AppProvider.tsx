import { PropsWithChildren, useEffect } from 'react';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useThemeStore } from '@store/ui/themeStore';
import { appTheme } from '@theme/theme';
import { queryClient } from './queryClient';
import { appConfig } from '@config/env';

export function AppProvider({ children }: PropsWithChildren) {
  const colorScheme = useThemeStore(state => state.colorScheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-mantine-color-scheme', colorScheme);
  }, [colorScheme]);

  return (
    <>
      <ColorSchemeScript defaultColorScheme={colorScheme} />
      <QueryClientProvider client={queryClient}>
        <MantineProvider
          theme={appTheme}
          defaultColorScheme={colorScheme}
          forceColorScheme={colorScheme}
        >
          <Notifications position="top-right" />
          {children}
        </MantineProvider>
        {appConfig.environment === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </>
  );
}
