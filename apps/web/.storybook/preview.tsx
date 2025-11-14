import type { Preview } from '@storybook/react';
import React from 'react';
import { AppProvider } from '../src/app/providers/AppProvider';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

const preview: Preview = {
  decorators: [Story => <AppProvider><Story /></AppProvider>],
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
