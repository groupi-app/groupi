import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { auditPackage } from './audit-package.js';

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
  const original = JSON.parse(
    await readFile(join(source, 'package.json'), 'utf8')
  );
  assert.deepEqual(metadata.dependencies, original.dependencies);
  assert.equal(metadata.version, original.version);
  assert.equal(metadata.publishConfig.access, 'public');
  assert.equal(metadata.publishConfig.registry, 'https://registry.npmjs.org/');
  const files = await auditPackage(installed);
  process.stdout.write(
    `Audited ${files.length} packed runtime and guidance files.\n`
  );
  run(['exec', 'groupi', '--help'], temporary);
  run(['exec', 'node', 'scripts/generate-reference.js', '--check'], installed);
  assert(
    (
      await readFile(join(installed, 'skills/groupi/SKILL.md'), 'utf8')
    ).includes('name: groupi')
  );
  assert(
    (
      await readFile(join(installed, 'docs/agent-workflows.json'), 'utf8')
    ).includes('planning')
  );
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
  run(
    [
      '--filter',
      '@groupi/convex',
      'exec',
      'vitest',
      'run',
      // These spawn installed CLI processes; avoid saturating hosted OS runners.
      '--maxWorkers=1',
      'tests/social-cli-rest.test.ts',
      'tests/cli-workflows-rest.test.ts',
      'tests/discord-cli-rest.test.ts',
      'tests/discussion-cli-rest.test.ts',
      'tests/images-cli-rest.test.ts',
      'tests/addon-participation-rest.test.ts',
    ],
    source,
    {
      ...process.env,
      CLI_TEST_BIN: resolve(installed, metadata.bin.groupi),
    }
  );
  // Retain only a successfully audited and tested artifact for manual release.
  if (process.env.GROUPI_PACKAGE_OUTPUT_DIR) {
    const destination = resolve(process.env.GROUPI_PACKAGE_OUTPUT_DIR);
    await mkdir(destination, { recursive: true });
    await copyFile(join(temporary, archive), join(destination, archive));
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}
