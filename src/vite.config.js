import { defineConfig } from 'vite';
import base44Plugin from '@base44/vite-plugin';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    base44Plugin({
      legacySDKImports: false,
      hmrNotifier: true,
      navigationNotifier: true,
      visualEditAgent: true,
    }),
  ],
  resolve: {
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'scheduler', '@base44/sdk'],
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    force: true,
    exclude: ['@base44/sdk'],
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'scheduler',
    ],
  },
});