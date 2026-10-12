import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { URL } from 'node:url';
import console from 'node:console';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(
  readFileSync(new URL('packages/shared/package.json', root), 'utf8')
);
for (const consumer of ['web', 'mobile']) {
  const require = createRequire(
    new URL(`packages/${consumer}/package.json`, root)
  );
  for (const [entry, target] of Object.entries(manifest.exports)) {
    assert.equal(typeof target, 'string');
    assert.ok(target.startsWith('./src/'));
    const specifier = '@groupi/shared' + (entry === '.' ? '' : entry.slice(1));
    assert.equal(
      require.resolve(specifier),
      fileURLToPath(new URL(`packages/shared/${target}`, root))
    );
  }
}
const backend = createRequire(new URL('convex/package.json', root));
assert.equal(
  backend.resolve('@groupi/shared/gdl'),
  fileURLToPath(new URL('packages/shared/src/gdl/index.ts', root))
);
for (const duplicate of [
  'convex/convex/_generated',
  'packages/web/convex/_generated',
]) {
  assert.ok(
    !existsSync(new URL(duplicate, root)),
    `${duplicate} must stay absent`
  );
}
// Exercise the ESM named-import path used by web tooling, not just resolution.
const webRequire = createRequire(new URL('packages/web/package.json', root));
execFileSync(
  process.execPath,
  [
    '--import',
    webRequire.resolve('tsx/esm'),
    '--input-type=module',
    '--eval',
    `import assert from 'node:assert/strict';
   import { baseThemes, sharedTokens, DEFAULT_LIGHT_THEME_ID, DEFAULT_DARK_THEME_ID }
     from '@groupi/shared/design/themes';
   assert.ok(baseThemes.length > 0);
   assert.ok(sharedTokens);
   assert.equal(typeof DEFAULT_LIGHT_THEME_ID, 'string');
   assert.equal(typeof DEFAULT_DARK_THEME_ID, 'string');`,
  ],
  { cwd: fileURLToPath(new URL('packages/web/', root)), stdio: 'inherit' }
);
console.log(
  'Workspace package entries resolve to shared source and ESM tooling loads named theme exports.'
);
