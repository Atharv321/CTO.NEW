import type { Preview } from '@storybook/react';
import { MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { theme } from '../src/theme/theme';
import '@mantine/core/styles.css';

const queryClient = new QueryClient();

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={theme}>
          <BrowserRouter>
            <Story />
          </BrowserRouter>
        </MantineProvider>
      </QueryClientProvider>
    ),
  ],
};

export default preview;
