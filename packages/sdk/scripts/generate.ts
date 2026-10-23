import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const check = process.argv.includes('--check');
const sourceRoot =
  process.env.SDK_SOURCE_ROOT ??
  process.argv.slice(2).find(arg => !arg.startsWith('--')) ??
  fileURLToPath(new URL('../../..', import.meta.url));
const { createApiV2App } = await import(
  pathToFileURL(resolve(sourceRoot, 'convex/api/v2/index.ts')).href
);
const response = await createApiV2App().request('/openapi.json');
const contract = await response.json();
const target = new URL('../openapi.json', import.meta.url);
if (check) {
  if (
    JSON.stringify(JSON.parse(readFileSync(target, 'utf8'))) !==
    JSON.stringify(contract)
  )
    throw new Error(
      'SDK OpenAPI snapshot is stale against the current backend source'
    );
} else writeFileSync(target, JSON.stringify(contract, null, 2) + '\n');
