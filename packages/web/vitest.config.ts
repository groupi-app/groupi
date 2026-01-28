import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    include: [
      'hooks/**/*.test.ts',
      'hooks/**/*.test.tsx',
      'components/**/*.test.tsx',
      'lib/**/*.test.ts',
      'stores/**/*.test.ts',
      '__tests__/**/*.test.ts',
      '__tests__/**/*.test.tsx',
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
    ],
    exclude: ['node_modules', 'dist', '.next', 'coverage'],
    setupFiles: ['./test-setup.ts'],
    // jsdom environment for React components and hooks
    environment: 'jsdom',
    // Ensure vitest processes require() calls with aliases
    server: {
      deps: {
        inline: [/@\/convex/],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        '.next/**',
        'hooks/**/*.test.ts',
        'hooks/**/*.test.tsx',
        'components/**/*.test.tsx',
        'lib/**/*.test.ts',
        '__tests__/**',
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'test-helpers.ts',
        'test-setup.ts',
        '**/*.config.*',
        '**/*.d.ts',
        'env.mjs',
        'middleware.ts',
        'coverage/**',
        'app/**/layout.tsx',
        'app/**/loading.tsx',
        'app/**/error.tsx',
        'app/**/not-found.tsx',
        'app/globals.css',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
      include: [
        'hooks/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
        'stores/**/*.{ts,tsx}',
      ],
    },
  },
  resolve: {
    alias: {
      '@/convex': resolve(__dirname, '../../convex'),
      '@': resolve(__dirname, '.'),
      '~': resolve(__dirname, '.'),
    },
  },
});
