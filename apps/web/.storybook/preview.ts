import type { Preview } from '@storybook/react';
import { AppProvider } from '../src/app/providers/AppProvider';
import React from 'react';

const preview: Preview = {
  decorators: [Story => <AppProvider>{Story()}</AppProvider>],
};

export default preview;
