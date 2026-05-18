/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/demos/fetch-state',
  server: { port: 4203, host: 'localhost' },
  preview: { port: 4303, host: 'localhost' },
  plugins: [react()],
  resolve: { conditions: ['@react-logic/source'] },
  build: { outDir: './dist', emptyOutDir: true, reportCompressedSize: true, commonjsOptions: { transformMixedEsModules: true } },
}));
