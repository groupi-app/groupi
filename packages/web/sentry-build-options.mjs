/**
 * Build-only isolation for test/CI. Runtime Sentry and Replay are unchanged.
 * Explicit production deployments always retain the normal release pipeline.
 * @param {Record<string, string | undefined>} env
 */
export function sentryBuildIsolationOptions(env) {
  if (env.VERCEL_ENV === 'production') return {};

  const ci = env.CI === 'true' || env.CI === '1';
  const testBranch = env.VERCEL_GIT_COMMIT_REF === 'test';
  // Local verification can use production-mode Next compilation without
  // declaring itself a production deployment or mutating Sentry releases.
  const localVerification =
    env.GROUPI_TEST_BUILD === '1' &&
    !env.VERCEL &&
    !env.VERCEL_ENV &&
    env.VERCEL_GIT_COMMIT_REF !== 'main';

  if (!ci && !testBranch && !localVerification) return {};
  return {
    telemetry: false,
    sourcemaps: { disable: true },
    release: { create: false, finalize: false },
  };
}
