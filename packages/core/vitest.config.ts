import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // Show the perf test's timings in the normal run.
    silent: false,
    testTimeout: 300_000,
    hookTimeout: 120_000,
  },
});
