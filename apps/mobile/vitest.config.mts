import { defineConfig } from 'vitest/config';

// Unit tests for the pure TypeScript modules in src/lib (no React Native imports).
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
});
