/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/demos/async-state',
  server: { port: 4202, host: 'localhost' },
  preview: { port: 4302, host: 'localhost' },
  plugins: [react()],
  build: { outDir: './dist', emptyOutDir: true, reportCompressedSize: true, commonjsOptions: { transformMixedEsModules: true } },
}));
