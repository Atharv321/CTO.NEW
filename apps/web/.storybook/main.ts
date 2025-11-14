import type { StorybookConfig } from '@storybook/react-vite';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const resolvePath = (relativePath: string) => resolve(rootDir, relativePath);

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async config => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': resolvePath('src'),
        '@components': resolvePath('src/components'),
        '@pages': resolvePath('src/pages'),
        '@hooks': resolvePath('src/hooks'),
        '@store': resolvePath('src/store'),
        '@api': resolvePath('src/api'),
        '@app': resolvePath('src/app'),
        '@utils': resolvePath('src/utils'),
        '@types': resolvePath('src/types'),
        '@theme': resolvePath('src/theme'),
        '@config': resolvePath('src/config'),
      };
    }
    return config;
  },
};

export default config;
