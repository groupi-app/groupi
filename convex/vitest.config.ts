import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
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
    // Suppress "Write outside of transaction" unhandled rejections from convex-test.
    // These occur because ctx.scheduler.runAfter() triggers async scheduled functions
    // that try to write after the transaction ends — a known convex-test limitation.
    dangerouslyIgnoreUnhandledErrors: true,
  },
});
