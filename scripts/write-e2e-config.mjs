import { mkdirSync, writeFileSync } from 'node:fs';

const directory = 'packages/web/public/.well-known';
mkdirSync(directory, { recursive: true });
writeFileSync(
  `${directory}/e2e-config.json`,
  JSON.stringify({
    convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
    branch: process.env.VERCEL_GIT_COMMIT_REF,
    commit: process.env.VERCEL_GIT_COMMIT_SHA,
    environment: process.env.VERCEL_ENV,
    timestamp: new Date().toISOString(),
  })
);
