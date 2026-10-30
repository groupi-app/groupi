import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

// Run the real shell boundary with an offline CLI recorder. No deployment,
// environment mutation, or frontend build can escape this temporary PATH.
function harness(t, initial = null, overrides = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'groupi-preview-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const statePath = join(directory, 'state.json');
  const callsPath = join(directory, 'calls.jsonl');
  writeFileSync(statePath, JSON.stringify(initial));
  writeFileSync(callsPath, '');
  writeFileSync(
    join(directory, 'npx'),
    `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(process.env.CALLS_PATH, JSON.stringify(args) + '\\n');
if (args[0] !== 'convex') process.exit(90);
let state = JSON.parse(fs.readFileSync(process.env.STATE_PATH, 'utf8'));
const save = () => fs.writeFileSync(process.env.STATE_PATH, JSON.stringify(state));
if (args[1] === 'deploy') {
  if (process.env.VERCEL_ENV === 'production') process.exit(0);
  const nameIndex = args.indexOf('--preview-name');
  const createIndex = args.indexOf('--preview-create');
  if (nameIndex < 0 && createIndex < 0) process.exit(91);
  if (process.env.FAIL_CLAIM === 'true') process.exit(9);
  const name = args[Math.max(nameIndex, createIndex) + 1];
  if (!state || createIndex >= 0) {
    state = { name, issuer: 'new-preview', records: [], environment: {} };
    save();
  }
  if (state.name !== name) process.exit(92);
  if (args.includes('--cmd') && process.env.FAIL_FINAL === 'true') process.exit(7);
  // Convex provisions before pushing functions; fresh auth analysis can fail
  // until the subsequent env commands configure the deployment.
  if (!state.environment.SITE_URL) process.exit(3);
  process.exit(0);
}
if (args[1] === 'env' && args[2] === 'set') {
  if (!state || process.env.FAIL_ENV === 'true') process.exit(8);
  if (args[args.indexOf('--preview-name') + 1] !== state.name) process.exit(93);
  state.environment[args[3]] = args[4];
  save();
  process.exit(0);
}
process.exit(94);
`,
    { mode: 0o755 }
  );
  for (const command of ['pnpm', 'node']) {
    writeFileSync(
      join(directory, command),
      `#!${process.execPath}
const fs = require('node:fs');
fs.appendFileSync(process.env.CALLS_PATH, JSON.stringify([${JSON.stringify(command)}, ...process.argv.slice(2), process.env.NEXT_PUBLIC_CONVEX_URL, process.env.NEXT_PUBLIC_CONVEX_SITE_URL]) + '\\n');
process.exit(process.env.FAIL_BUILD === 'true' ? 6 : 0);
`,
      { mode: 0o755 }
    );
  }
  return {
    run: () =>
      spawnSync('bash', [resolve('scripts/vercel-build.sh')], {
        encoding: 'utf8',
        env: {
          ...process.env,
          PATH: `${directory}:${process.env.PATH}`,
          VERCEL_ENV: 'preview',
          VERCEL_GIT_COMMIT_REF: 'feature/Stable-Preview',
          VERCEL_BRANCH_URL: 'branch.example.com',
          BETTER_AUTH_SECRET: 'synthetic-test-secret',
          STATE_PATH: statePath,
          CALLS_PATH: callsPath,
          ...overrides,
        },
      }),
    state: () => JSON.parse(readFileSync(statePath, 'utf8')),
    calls: () =>
      readFileSync(callsPath, 'utf8')
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line)),
  };
}
const existing = {
  name: 'feature-stable-preview',
  issuer: 'retained-preview',
  records: [{ id: 'existing-member' }],
  environment: {
    SITE_URL: 'https://old.example.com',
    CUSTOM_SETTING: 'retained',
  },
};

test('repeated preview builds retain existing records, issuer and custom configuration', t => {
  const preview = harness(t, existing);
  for (let build = 0; build < 2; build++) {
    const result = preview.run();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(preview.state().issuer, existing.issuer);
    assert.deepEqual(preview.state().records, existing.records);
    assert.equal(preview.state().environment.CUSTOM_SETTING, 'retained');
  }
  assert.ok(preview.calls().every(args => !args.includes('--preview-create')));
  assert.equal(preview.calls().filter(args => args[1] === 'deploy').length, 4);
});

test('fresh preview is provisioned non-destructively before auth setup and final build', t => {
  const preview = harness(t);
  const result = preview.run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Initial preview push deferred/);
  const calls = preview.calls();
  assert.deepEqual(calls[0], [
    'convex',
    'deploy',
    '--preview-name',
    'feature-stable-preview',
  ]);
  const expected = {
    SITE_URL: 'https://branch.example.com',
    BETTER_AUTH_URL: 'https://branch.example.com',
    PASSKEY_RP_ID: 'branch.example.com',
    PASSKEY_RP_NAME: 'Groupi',
    E2E_TESTING: 'true',
    BETTER_AUTH_SECRET: 'synthetic-test-secret',
  };
  assert.deepEqual(preview.state().environment, expected);
  assert.deepEqual(
    calls.slice(1, -1).map(args => args[3]),
    Object.keys(expected)
  );
  assert.deepEqual(calls.at(-1), [
    'convex',
    'deploy',
    '--preview-name',
    'feature-stable-preview',
    '--cmd-url-env-var-name',
    'NEXT_PUBLIC_CONVEX_URL',
    '--cmd',
    'pnpm --filter @groupi/web build && node scripts/write-e2e-config.mjs',
  ]);
  assert.ok(calls.every(args => !args.includes('--preview-create')));
});

for (const failure of ['FAIL_ENV', 'FAIL_FINAL']) {
  test(`${failure} fails closed without resetting a preview`, t => {
    const preview = harness(t, existing, { [failure]: 'true' });
    assert.notEqual(preview.run().status, 0);
    assert.equal(preview.state().issuer, existing.issuer);
    assert.deepEqual(preview.state().records, existing.records);
    assert.ok(
      preview.calls().every(args => !args.includes('--preview-create'))
    );
    if (failure === 'FAIL_ENV') assert.equal(preview.calls().length, 2);
  });
}

test('failed provisioning cannot continue to the frontend build', t => {
  const preview = harness(t, null, { FAIL_CLAIM: 'true' });
  assert.notEqual(preview.run().status, 0);
  assert.equal(preview.state(), null);
  assert.equal(preview.calls().length, 2);
  assert.ok(preview.calls().every(args => !args.includes('--cmd')));
});

test('missing preview host fails before any CLI invocation', t => {
  const preview = harness(t, existing, {
    VERCEL_BRANCH_URL: '',
    VERCEL_URL: '',
  });
  assert.notEqual(preview.run().status, 0);
  assert.deepEqual(preview.calls(), []);
});

test('production keeps its single existing deploy command without preview configuration', t => {
  const preview = harness(t, existing, { VERCEL_ENV: 'production' });
  assert.equal(preview.run().status, 0);
  assert.deepEqual(preview.calls(), [
    [
      'convex',
      'deploy',
      '--cmd-url-env-var-name',
      'NEXT_PUBLIC_CONVEX_URL',
      '--cmd',
      'pnpm --filter @groupi/web build && node scripts/write-e2e-config.mjs',
    ],
  ]);
  assert.deepEqual(preview.state(), existing);
});

test('shared test builds only the frontend without backend or credential writes', t => {
  const preview = harness(t, existing, {
    VERCEL_GIT_COMMIT_REF: 'test',
    NEXT_PUBLIC_CONVEX_URL: '',
    CONVEX_URL: '',
  });
  assert.equal(preview.run().status, 0);
  assert.deepEqual(preview.state(), existing);
  assert.deepEqual(preview.calls(), [
    [
      'pnpm',
      '--filter',
      '@groupi/web',
      'build',
      'https://zany-rooster-824.convex.cloud',
      'https://zany-rooster-824.convex.site',
    ],
    [
      'node',
      'scripts/write-e2e-config.mjs',
      'https://zany-rooster-824.convex.cloud',
      'https://zany-rooster-824.convex.site',
    ],
  ]);
});

for (const overrides of [
  { VERCEL_ENV: 'production' },
  { NEXT_PUBLIC_CONVEX_URL: 'https://wrong.convex.cloud' },
  { CONVEX_URL: 'https://wrong.convex.cloud' },
]) {
  test(`shared test fails closed for unsafe build selection ${JSON.stringify(overrides)}`, t => {
    const preview = harness(t, existing, {
      VERCEL_GIT_COMMIT_REF: 'test',
      NEXT_PUBLIC_CONVEX_URL: '',
      CONVEX_URL: '',
      ...overrides,
    });
    assert.notEqual(preview.run().status, 0);
    assert.deepEqual(preview.calls(), []);
    assert.deepEqual(preview.state(), existing);
  });
}

test('shared test build failure does not write readiness metadata or backend state', t => {
  const preview = harness(t, existing, {
    VERCEL_GIT_COMMIT_REF: 'test',
    NEXT_PUBLIC_CONVEX_URL: '',
    CONVEX_URL: '',
    FAIL_BUILD: 'true',
  });
  assert.notEqual(preview.run().status, 0);
  assert.equal(preview.calls().length, 1);
  assert.deepEqual(preview.state(), existing);
});
