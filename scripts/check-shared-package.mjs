import console from 'node:console';
import process from 'node:process';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { URL, fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { symlinkSync } from 'node:fs';

// Run against the tarball produced by pnpm pack after CI compiles shared.
const tarball = path.resolve(process.argv[2] ?? '');
assert.ok(process.argv[2], 'Pass the pnpm pack tarball path');
const scratch = mkdtempSync(path.join(tmpdir(), 'groupi-shared-package-'));
try {
  execFileSync('tar', ['-xzf', tarball, '-C', scratch]);
  const packageRoot = path.join(scratch, 'package');
  symlinkSync(
    fileURLToPath(new URL('../packages/shared/node_modules', import.meta.url)),
    path.join(packageRoot, 'node_modules'),
    'dir'
  );
  const require = createRequire(path.join(packageRoot, 'package.json'));
  const manifest = JSON.parse(
    readFileSync(path.join(packageRoot, 'package.json'), 'utf8')
  );
  for (const [entry, conditions] of Object.entries(manifest.exports)) {
    for (const condition of ['import', 'require']) {
      const { types, default: target } = conditions[condition];
      for (const file of [types, target]) {
        assert.ok(
          file?.startsWith('./dist/'),
          `${entry} ${condition} must use dist`
        );
        assert.ok(
          existsSync(path.join(packageRoot, file)),
          `${entry} ${condition} missing ${file}`
        );
      }
      // Load the packed files with installed peers; source exports are not involved.
      execFileSync(process.execPath, [
        '--check',
        path.join(packageRoot, target),
      ]);
      if (condition === 'require') {
        require(path.join(packageRoot, target));
      } else {
        await import(pathToFileURL(path.join(packageRoot, target)).href);
      }
    }
  }
  for (const field of ['main', 'module', 'types']) {
    assert.ok(manifest[field].startsWith('dist/'));
    assert.ok(existsSync(path.join(packageRoot, manifest[field])));
  }
  console.log(
    'Packed shared exports contain compiled CJS, ESM, and declarations.'
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
