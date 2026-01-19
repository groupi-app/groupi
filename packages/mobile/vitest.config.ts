import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      '__tests__/**/*.test.ts',
      '__tests__/**/*.test.tsx',
    ],
    exclude: ['node_modules', 'dist', '.expo', 'android', 'ios', 'coverage'],
    environment: 'node', // Use node for React Native logic tests
    setupFiles: ['./test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        '.expo/**',
        'android/**',
        'ios/**',
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        '__tests__/**',
        'test-helpers.ts',
        'test-setup.ts',
        '**/*.config.*',
        '**/*.d.ts',
        'coverage/**',
        'expo/**',
        'app.config.js',
        'babel.config.js',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
      include: ['src/**/*.{ts,tsx}'],
    },
  },
  resolve: {
    alias: {
      '@': './src',
      '@/components': './src/components',
      '@/lib': './src/lib',
      '@/screens': './src/screens',
    },
  },
});
