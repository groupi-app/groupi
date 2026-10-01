import { afterEach, expect, it } from 'vitest';
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { auditPackage } from '../scripts/audit-package.js';

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories.splice(0).map(dir => rm(dir, { recursive: true }))
  );
});

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'groupi-audit-'));
  directories.push(directory);
  for (const path of ['bin', 'src', 'docs', 'skills']) {
    await cp(new URL(`../${path}`, import.meta.url), join(directory, path), {
      recursive: true,
    });
  }
  await mkdir(join(directory, 'scripts'));
  await cp(
    new URL('../scripts/generate-reference.js', import.meta.url),
    join(directory, 'scripts/generate-reference.js')
  );
  for (const path of ['package.json', 'README.md']) {
    await cp(new URL(`../${path}`, import.meta.url), join(directory, path));
  }
  await writeFile(join(directory, 'LICENSE'), 'Test license fixture');
  return directory;
}

it('accepts runtime and guidance files and ignores installed dependencies', async () => {
  const directory = await fixture();
  await mkdir(join(directory, 'node_modules'));
  await writeFile(
    join(directory, 'node_modules', 'foreign-file.txt'),
    'dependency'
  );
  expect(await auditPackage(directory)).toContain('bin/groupi.js');
});

it.each([
  'src/.env',
  'docs/credentials.json',
  'src/profile.json',
  'skills/groupi/token.pem',
])('rejects unexpected private/runtime files: %s', async name => {
  const directory = await fixture();
  await writeFile(join(directory, name), 'private test fixture');
  // docs JSON is allowed for command contracts, so credential filenames need
  // an explicit denylist in addition to directory/extension allowlisting.
  await expect(auditPackage(directory)).rejects.toThrow(
    /Unapproved packed file/
  );
});

it('rejects recognizable credentials without disclosing the content', async () => {
  const directory = await fixture();
  const token = `npm_${'a'.repeat(36)}`;
  await writeFile(join(directory, 'docs/leaked.md'), token);
  await expect(auditPackage(directory)).rejects.toThrow(
    'Potential credential in packed file: docs/leaked.md'
  );
});

it('requires the installed runtime entrypoint', async () => {
  const directory = await fixture();
  await rm(join(directory, 'bin/groupi.js'));
  await expect(auditPackage(directory)).rejects.toThrow(
    'Missing runtime/guidance file: bin/groupi.js'
  );
});
