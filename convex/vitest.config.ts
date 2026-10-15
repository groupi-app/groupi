import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // Public CLI bridge tests spawn processes; bound workspace runner contention.
    maxWorkers: 2,
    include: ['tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', 'dist'],
    // Convex functions run in Edge Runtime environment
    environment: 'edge-runtime',
    // Required for convex-test to work properly
    server: {
      deps: {
        inline: ['convex-test'],
      },
    },
    // Unhandled scheduler failures must fail CI, even when assertions pass.
    dangerouslyIgnoreUnhandledErrors: false,
  },
});
