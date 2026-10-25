// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

it.each(['inviteLists', 'invites'])(
  'initializes OpenAPI schemas when the split %s REST module is analyzed cold',
  route => {
    // Match Convex's local isolate bundle settings. A fresh process imports only
    // this entry, without the warm REST application's schema side effects.
    const output = execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `
import { createRequire } from 'node:module';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve('convex/package.json'))('esbuild');
const directory = await mkdtemp(join(tmpdir(), 'groupi-api-cold-import-'));
async function entries(path) {
  const files = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const target = join(path, entry.name);
    if (entry.isDirectory()) files.push(...await entries(target));
    else if (entry.name.endsWith('.ts')) files.push(target);
  }
  return files;
}
try {
  await writeFile(join(directory, 'package.json'), '{"type":"module"}');
  await build({
    entryPoints: await entries('convex/api/v2'),
    outdir: directory, outbase: 'convex', bundle: true, splitting: true,
    format: 'esm', platform: 'browser', conditions: ['convex', 'module'],
    treeShaking: true, minifySyntax: true, minifyIdentifiers: true, keepNames: true,
    define: { 'process.env.NODE_ENV': '"production"' },
  });
  const module = await import(pathToFileURL(join(directory, 'api/v2/routes/${route}.js')));
  console.log(typeof module.${route === 'inviteLists' ? 'createInviteListRoutes' : 'createInviteRoutes'});
} finally {
  await rm(directory, { recursive: true, force: true });
}
`,
      ],
      { cwd: resolve(import.meta.dirname, '../..'), encoding: 'utf8' }
    );
    expect(output.trim()).toBe('function');
  }
);
