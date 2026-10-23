import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    root: new URL('../..', import.meta.url).pathname,
    include: ['packages/sdk/tests/*.integration.test.ts'],
    environment: 'node',
    maxWorkers: 1,
    server: { deps: { inline: ['convex-test'] } },
  },
});
