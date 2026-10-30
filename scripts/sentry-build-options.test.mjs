import { URL } from 'node:url';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { sentryBuildIsolationOptions } from '../packages/web/sentry-build-options.mjs';

const isolated = {
  telemetry: false,
  sourcemaps: { disable: true },
  release: { create: false, finalize: false },
};

for (const env of [
  { CI: 'true' },
  { CI: '1', NODE_ENV: 'production' },
  { VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'test' },
  { GROUPI_TEST_BUILD: '1', NODE_ENV: 'production' },
]) {
  test(`isolates build network operations for ${JSON.stringify(env)}`, () => {
    assert.deepEqual(sentryBuildIsolationOptions(env), isolated);
  });
}

for (const env of [
  {},
  { CI: 'false' },
  { CI: '0' },
  { VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'feature' },
  { VERCEL_ENV: 'production', CI: 'true', GROUPI_TEST_BUILD: '1' },
  { VERCEL_ENV: 'production', VERCEL_GIT_COMMIT_REF: 'test' },
  { GROUPI_TEST_BUILD: '1', VERCEL: '1' },
  { GROUPI_TEST_BUILD: '1', VERCEL_ENV: 'preview' },
  { GROUPI_TEST_BUILD: '1', VERCEL_GIT_COMMIT_REF: 'main' },
]) {
  test(`preserves ordinary or production behavior for ${JSON.stringify(env)}`, () => {
    assert.deepEqual(sentryBuildIsolationOptions(env), {});
  });
}

test('Next config applies only build isolation, preserving runtime routing and instrumentation', () => {
  const source = readFileSync(
    new URL('../packages/web/next.config.mjs', import.meta.url),
    'utf8'
  );
  assert.match(source, /\.\.\.sentryBuildIsolationOptions\(process\.env\)/);
  assert.match(source, /tunnelRoute: '\/monitoring'/);
  assert.match(source, /automaticVercelMonitors: true/);
  assert.doesNotMatch(source, /^\s*disable:/m);
});
