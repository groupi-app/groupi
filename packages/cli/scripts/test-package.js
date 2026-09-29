import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const pnpm = process.env.npm_execpath;
assert(pnpm, 'Run through pnpm --filter @groupi/cli test:package');
const source = process.cwd();
const temporary = await mkdtemp(join(tmpdir(), 'groupi-package-'));

/** @param {string[]} args @param {string} cwd @param {NodeJS.ProcessEnv} [env] */
function run(args, cwd, env = process.env) {
  const result = spawnSync(
    process.execPath,
    [/** @type {string} */ (pnpm), ...args],
    { cwd, env, encoding: 'utf8', stdio: 'inherit' }
  );
  assert.equal(result.status, 0, `Package check failed: ${args.join(' ')}`);
}

try {
  run(['pack', '--pack-destination', temporary], source);
  const archive = (await readdir(temporary)).find(name =>
    name.endsWith('.tgz')
  );
  assert(archive, 'A package archive must be produced');
  await writeFile(
    join(temporary, 'package.json'),
    JSON.stringify({ private: true })
  );
  run(
    ['add', '--prefer-offline', '--ignore-scripts', join(temporary, archive)],
    temporary
  );
  const installed = join(temporary, 'node_modules', '@groupi', 'cli');
  const metadata = JSON.parse(
    await readFile(join(installed, 'package.json'), 'utf8')
  );
  assert.deepEqual(Object.keys(metadata.dependencies), [
    '@napi-rs/keyring',
    'commander',
  ]);
  assert.deepEqual(
    (await readdir(installed))
      .filter(name => !['LICENSE', 'node_modules'].includes(name))
      .sort(),
    ['README.md', 'bin', 'package.json', 'src']
  );
  run(['exec', 'groupi', '--help'], temporary);
  run(
    [
      'exec',
      'node',
      '--input-type=module',
      '-e',
      'await import("@napi-rs/keyring")',
    ],
    installed
  );
  run(['exec', 'vitest', 'run', 'tests'], source, {
    ...process.env,
    CLI_TEST_BIN: resolve(installed, metadata.bin.groupi),
  });
} finally {
  await rm(temporary, { recursive: true, force: true });
}
