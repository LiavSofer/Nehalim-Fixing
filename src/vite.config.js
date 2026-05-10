import { defineConfig } from 'vite';
import base44Plugin from '@base44/vite-plugin';

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
    dedupe: ['react', 'react-dom'],
  },
});