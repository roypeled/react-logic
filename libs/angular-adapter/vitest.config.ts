import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    conditions: ['@react-logic/source'],
  },
  test: {
    name: '@react-logic/angular-adapter',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8',
    },
  },
});
