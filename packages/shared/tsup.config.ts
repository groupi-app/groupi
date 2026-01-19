import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'hooks/index': 'src/hooks/index.ts',
    'utils/index': 'src/utils/index.ts',
    'types/index': 'src/types/index.ts',
    'platform/index': 'src/platform/index.ts',
    'design/index': 'src/design/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: {
    resolve: true,
  },
  clean: true,
  external: ['react', 'react-native', 'convex/react'],
  target: 'es2020',
  splitting: false,
  sourcemap: true,
  minify: false,
  treeshake: true,
});
