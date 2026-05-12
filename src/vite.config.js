import { defineConfig } from 'vite';
import base44Plugin from '@base44/vite-plugin';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Plugin that forces all react imports to resolve to the same instance
function reactSingletonPlugin() {
  const reactPath = resolve(__dirname, 'node_modules/react/index.js');
  const reactDomPath = resolve(__dirname, 'node_modules/react-dom/index.js');
  const jsxRuntimePath = resolve(__dirname, 'node_modules/react/jsx-runtime.js');
  const jsxDevRuntimePath = resolve(__dirname, 'node_modules/react/jsx-dev-runtime.js');
  const schedulerPath = resolve(__dirname, 'node_modules/scheduler/index.js');

  return {
    name: 'react-singleton',
    enforce: 'pre',
    resolveId(id) {
      if (id === 'react') return reactPath;
      if (id === 'react-dom') return reactDomPath;
      if (id === 'react/jsx-runtime') return jsxRuntimePath;
      if (id === 'react/jsx-dev-runtime') return jsxDevRuntimePath;
      if (id === 'scheduler') return schedulerPath;
      return null;
    },
  };
}

export default defineConfig({
  plugins: [
    reactSingletonPlugin(),
    base44Plugin({
      legacySDKImports: false,
      hmrNotifier: true,
      navigationNotifier: true,
      visualEditAgent: true,
    }),
  ],
  resolve: {
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'scheduler'],
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'scheduler'],
    exclude: ['@base44/sdk'],
    force: true,
  },
});