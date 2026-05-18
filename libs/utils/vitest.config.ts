import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    conditions: ['@react-logic/source'],
  },
  test: {
    name: '@react-logic/utils',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8',
    },
  },
});
