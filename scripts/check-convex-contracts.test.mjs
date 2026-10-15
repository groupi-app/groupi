import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import process from 'node:process';

const root = fileURLToPath(new URL('../', import.meta.url));

for (const [name, replacement, expected] of [
  [
    'any annotation',
    'export const listOwnedApps: any = query({',
    'listOwnedApps: any',
  ],
  [
    'unknown annotation',
    'export const listOwnedApps: unknown = query({',
    'listOwnedApps: unknown',
  ],
  ['erased alias', null, 'erasedQuery: any'],
]) {
  test(`rejects a query hidden by ${name}`, () => {
    // Overlay the compiler's read only: never rewrite a live source file.
    const harness = `
      import ts from 'typescript';
      const read = ts.sys.readFile;
      let applied = false;
      ts.sys.readFile = (file, ...args) => {
        const content = read(file, ...args);
        if (!file.endsWith('/convex/delegatedApps/queries.ts') || !content) return content;
        const original = 'export const listOwnedApps = query({';
        if (!content.includes(original)) throw new Error('Regression fixture no longer matches');
        applied = true;
        return ${
          replacement === null
            ? "content + '\\nconst erased = listOwnedApps as any; export { erased as erasedQuery };\\n'"
            : `content.replace(original, ${JSON.stringify(replacement)})`
        };
      };
      await import('./scripts/check-convex-contracts.mjs');
      if (!applied) throw new Error('Regression fixture was not inspected');
    `;
    const result = spawnSync(
      process.execPath,
      ['--input-type=module', '-e', harness],
      {
        cwd: root,
        encoding: 'utf8',
        timeout: 120_000,
      }
    );
    assert.ifError(result.error);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.ok(result.stderr.includes(expected), result.stdout + result.stderr);
  });
}
