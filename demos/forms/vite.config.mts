/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/demos/forms',
  server: { port: 4204, host: 'localhost' },
  preview: { port: 4304, host: 'localhost' },
  plugins: [react()],
  build: { outDir: './dist', emptyOutDir: true, reportCompressedSize: true, commonjsOptions: { transformMixedEsModules: true } },
}));
