import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const resolvePath = (relativePath: string) => resolve(rootDir, relativePath);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolvePath('./src'),
      '@components': resolvePath('./src/components'),
      '@pages': resolvePath('./src/pages'),
      '@hooks': resolvePath('./src/hooks'),
      '@store': resolvePath('./src/store'),
      '@api': resolvePath('./src/api'),
      '@app': resolvePath('./src/app'),
      '@utils': resolvePath('./src/utils'),
      '@types': resolvePath('./src/types'),
      '@theme': resolvePath('./src/theme'),
      '@config': resolvePath('./src/config'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
});
