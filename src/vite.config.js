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
  cacheDir: 'node_modules/.vite_cache_v2',
  resolve: {
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'scheduler', 'react-router-dom', '@base44/sdk'],
    alias: {
      '@': resolve(__dirname, 'src'),
      'react': resolve(__dirname, 'node_modules/react'),
      'react-dom': resolve(__dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': resolve(__dirname, 'node_modules/react/jsx-runtime'),
      'react/jsx-dev-runtime': resolve(__dirname, 'node_modules/react/jsx-dev-runtime'),
    },
  },
  optimizeDeps: {
    force: true,
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'scheduler',
      '@base44/sdk',
    ],
  },
});