import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';
import globals from 'globals';

const eslintConfig = [
  // Global ignores - must be first
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.next/**',
      '**/build/**',
      '**/.expo/**',
    ],
  },

  // Base JavaScript recommended rules
  js.configs.recommended,

  // TypeScript recommended rules (flat config)
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    languageOptions: {
      parser: typescriptParser,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
    },
  },

  // React recommended rules (flat config)
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      '@next/next': nextPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // Prettier config (must be last to override other formatting rules)
  prettierConfig,

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      prettier,
      '@typescript-eslint': typescriptEslint,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
      },
    },
    rules: {
      // Prettier integration
      'prettier/prettier': 'error',

      // Override specific rules if needed
      'react/react-in-jsx-scope': 'off', // Not needed in Next.js
      'react/prop-types': 'off', // Using TypeScript for prop validation
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-console': 'warn', // Use structured logging or remove for production
      '@typescript-eslint/no-explicit-any': 'warn', // Allow any but warn
      '@typescript-eslint/no-empty-object-type': 'warn',
      'no-undef': 'off', // TypeScript handles this
      'no-fallthrough': 'error',
    },
  },
  // Server components can return JSX from try/catch
  {
    files: ['**/*-server.tsx', '**/*-server.ts'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/error-boundaries': 'off', // Server components can return JSX from try/catch
    },
  },

  // React Native specific rules
  {
    files: ['packages/mobile/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
        // React Native globals
        __DEV__: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        navigator: 'readonly',
        XMLHttpRequest: 'readonly',
      },
    },
    rules: {
      // React Native doesn't have DOM, but uses console for development
      'no-console': 'off',
      // React Native uses different import patterns
      'import/no-unresolved': 'off',
    },
  },

  // Convex functions - allow console logging (official Convex logging method)
  {
    files: ['**/convex/**/*.{js,ts}'],
    rules: {
      'no-console': 'off', // console.* is the official logging method for Convex functions
    },
  },

  // Shared package - platform agnostic rules
  {
    files: ['packages/shared/**/*.{js,ts,tsx}'],
    rules: {
      'no-console': 'warn', // Shared code should use platform adapters for logging
      // Ensure no platform-specific imports leak in
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react-native', 'expo-*', 'next/*'],
              message:
                'Platform-specific imports not allowed in shared package. Use platform adapters instead.',
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
