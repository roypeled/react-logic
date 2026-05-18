/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/demos/di',
  server: { port: 4205, host: 'localhost' },
  preview: { port: 4305, host: 'localhost' },
  plugins: [react()],
  build: { outDir: './dist', emptyOutDir: true, reportCompressedSize: true, commonjsOptions: { transformMixedEsModules: true } },
}));
