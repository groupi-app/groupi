import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Separate browsers/documents keep singleton bootstrap state independent.
// No app server, app build, credentials, account creation, or network backend.
const cases = [
  ['--bootstrap-regression'],
  ['--bootstrap-history'],
  ['--bootstrap-gap'],
  ['--bootstrap-regression', '--legacy-history'],
  ['--unknown-discard'],
];
for (const args of cases) {
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL('./run-components-browser.mjs', import.meta.url)),
      ...args,
    ],
    { stdio: 'inherit', timeout: 120_000 }
  );
  if (result.error || result.status !== 0) {
    console.error(result.error ?? `History case failed: ${args.join(' ')}`);
    process.exit(1);
  }
}
