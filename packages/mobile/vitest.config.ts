import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  test: {
    globals: true,
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      '__tests__/**/*.test.ts',
      '__tests__/**/*.test.tsx',
    ],
    exclude: ['node_modules', 'dist', '.expo', 'android', 'ios', 'coverage'],
    environment: 'node',
    setupFiles: ['./test-setup.ts'],
    server: {
      deps: {
        // Better Auth's Expo adapter is ESM and must be transformed so its
        // React Native/Expo imports resolve to the test setup mocks.
        inline: ['@better-auth/expo'],
        // Prevent Vitest from trying to parse React Native's Flow syntax
        external: [
          'react-native',
          'react-native-reanimated',
          'react-native-worklets',
          'react-native-gesture-handler',
          'react-native-screens',
          'react-native-safe-area-context',
          'react-native-toast-message',
          'expo-router',
          'expo-secure-store',
          'expo-constants',
          'expo-splash-screen',
          'expo-status-bar',
          'expo-linking',
          '@expo/vector-icons',
          '@convex-dev/better-auth',
          'better-auth',
          '@testing-library/react-native',
        ],
      },
    },
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
        'test-helpers.tsx',
        'test-setup.ts',
        '**/*.config.*',
        '**/*.d.ts',
        'coverage/**',
        'expo/**',
        'app.config.ts',
        'babel.config.js',
      ],
      thresholds: {
        // Integrated parity-suite baseline is currently 7.90% statements,
        // 8.46% branches, 7.16% functions, and 7.92% lines. Keep modest
        // headroom for source growth while preventing a return to near-zero.
        branches: 7,
        functions: 6,
        lines: 7,
        statements: 7,
      },
      include: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    },
  },
  resolve: {
    alias: {
      '@groupi/shared/utils': fileURLToPath(
        new URL('../shared/src/utils/index.ts', import.meta.url)
      ),
      '@': './src',
      '@/components': './src/components',
      '@/lib': './src/lib',
      '@/hooks': './src/hooks',
      '@/context': './src/context',
      '@/theme': './src/theme',
      '@/providers': './src/providers',
      'convex/_generated/api': fileURLToPath(
        new URL('../../convex/_generated/api.js', import.meta.url)
      ),
      'convex/_generated/dataModel': fileURLToPath(
        new URL('../../convex/_generated/dataModel.d.ts', import.meta.url)
      ),
      'convex/_generated/server': fileURLToPath(
        new URL('../../convex/_generated/server.js', import.meta.url)
      ),
    },
  },
});
