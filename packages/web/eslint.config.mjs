import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
    ],
  },
  {
    files: ['**/*-server.tsx', '**/*-server.ts'],
    rules: {
      'react-hooks/error-boundaries': 'off', // Server components can return JSX from try/catch
    },
  },
  {
    files: ['convex/**/*.{js,ts}'],
    rules: {
      'no-console': 'off', // console.* is the official logging method for Convex functions
    },
  },
];

export default eslintConfig;
