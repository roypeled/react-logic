/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/demos/batching',
  server: { port: 4206, host: 'localhost' },
  preview: { port: 4306, host: 'localhost' },
  plugins: [react()],
  build: { outDir: './dist', emptyOutDir: true, reportCompressedSize: true, commonjsOptions: { transformMixedEsModules: true } },
}));
