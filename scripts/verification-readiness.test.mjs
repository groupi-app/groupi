import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkReadiness, localRefs } from './verification-readiness.mjs';
const sha = 'a'.repeat(40);
const input = {
  url: 'https://test.groupi.gg',
  sha,
  backend: 'https://test-example.convex.cloud',
};
const config = {
  commit: sha,
  convexUrl: input.backend,
  environment: 'preview',
};
function fetcher(value = config, status = 200) {
  return async () => ({
    ok: status === 200,
    status,
    json: async () => ({ status: 'ok', ...value }),
  });
}
test('public checks never claim authenticated or native verification', async () => {
  const result = await checkReadiness(input, fetcher());
  assert.equal(result.web.status, 'verified');
  assert.equal(result.signedIn.status, 'unverified');
  assert.equal(result.native.status, 'unverified');
  assert.equal(result.backend.sourceCommit, 'unverified');
});
for (const [name, value] of Object.entries({
  'missing commit': { ...config, commit: undefined },
  'stale commit': { ...config, commit: 'b'.repeat(40) },
  production: { ...config, environment: 'production' },
  'missing environment': { ...config, environment: undefined },
  'wrong backend': { ...config, convexUrl: 'https://other.convex.cloud' },
  'untrusted backend': { ...config, convexUrl: 'https://example.com' },
}))
  test(name, async () => assert.rejects(checkReadiness(input, fetcher(value))));
test('missing endpoint fails', async () =>
  assert.rejects(checkReadiness(input, fetcher(null, 404))));
test('malformed JSON fails', async () =>
  assert.rejects(
    checkReadiness(input, async () => ({
      ok: true,
      json() {
        throw new Error('invalid JSON');
      },
    }))
  ));
test('backend outage fails after config succeeds', async () => {
  let calls = 0;
  await assert.rejects(
    checkReadiness(input, async () =>
      ++calls === 1
        ? { ok: true, json: async () => config }
        : { ok: false, status: 503 }
    )
  );
});
test('credential-bearing URL rejected before request', async () => {
  await assert.rejects(
    checkReadiness({ ...input, url: 'https://secret@example.com' }, () =>
      assert.fail('must not fetch')
    )
  );
});
test('missing local refs are explicit', () =>
  assert.equal(
    localRefs(() => {
      throw new Error();
    }).refs.HEAD,
    null
  ));

test('malformed health body fails', async () => {
  let calls = 0;
  await assert.rejects(
    checkReadiness(input, async () => ({
      ok: true,
      json: async () => (++calls === 1 ? config : {}),
    }))
  );
});

test('metadata writer preserves special characters and includes revision evidence', async () => {
  const { mkdtempSync, readFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { execFileSync } = await import('node:child_process');
  const cwd = mkdtempSync(join(tmpdir(), 'groupi-readiness-'));
  try {
    execFileSync(
      process.execPath,
      [fileURLToPath(new URL('./write-e2e-config.mjs', import.meta.url))],
      {
        cwd,
        env: {
          NEXT_PUBLIC_CONVEX_URL: input.backend,
          VERCEL_GIT_COMMIT_REF: 'feature/quoted"branch',
          VERCEL_GIT_COMMIT_SHA: sha,
          VERCEL_ENV: 'preview',
        },
      }
    );
    const result = JSON.parse(
      readFileSync(
        join(cwd, 'packages/web/public/.well-known/e2e-config.json'),
        'utf8'
      )
    );
    assert.equal(result.commit, sha);
    assert.equal(result.environment, 'preview');
    assert.equal(result.branch, 'feature/quoted"branch');
    assert.equal(result.convexUrl, input.backend);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('CLI missing prerequisites exits nonzero with a visible blocker', async () => {
  const { spawnSync } = await import('node:child_process');
  const { fileURLToPath } = await import('node:url');
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL('./verification-readiness.mjs', import.meta.url)),
      input.url,
    ],
    { encoding: 'utf8' }
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Readiness blocked:.*commit SHA/);
});
