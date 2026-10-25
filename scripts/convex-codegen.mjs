import { URL } from 'node:url';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Anchor CLI discovery and output to the repository, regardless of caller cwd.
const cwd = fileURLToPath(new URL('..', import.meta.url));
const result = spawnSync('pnpm', ['exec', 'convex', 'codegen'], {
  cwd,
  stdio: 'inherit',
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
