import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', 'dist'],
    // Node environment for platform-agnostic utilities
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/test-helpers.ts',
      ],
      // Enforced baseline floors; improvement targets and scope: docs/testing.md.
      // Vitest global metrics belong directly under thresholds (no global wrapper).
      thresholds: {
        branches: 23.5,
        functions: 52.9,
        lines: 28.7,
        statements: 27.6,
      },
    },
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
});
