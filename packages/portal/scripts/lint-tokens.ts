import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '../src');
async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map(entry =>
        entry.isDirectory()
          ? files(resolve(directory, entry.name))
          : /\.(tsx|css)$/.test(entry.name)
            ? [resolve(directory, entry.name)]
            : []
      )
    )
  ).flat();
}
const violations: string[] = [];
for (const path of await files(root)) {
  const source = await readFile(path, 'utf8');
  const classes =
    source.match(
      /(?:bg|text|border)-(?:red|green|blue|gray|slate|purple|yellow|orange|emerald|zinc)-\d+|\bshadow-(?:sm|md|lg|xl|2xl)\b|\brounded-(?:xl|2xl|3xl)\b|\bz-\d+\b/g
    ) ?? [];
  for (const value of classes)
    violations.push(`${path}: nonsemantic utility ${value}`);
  if (path.endsWith('.css')) {
    for (const match of source.matchAll(
      /(?:^|[;{])\s*(color|background(?:-color)?|border-radius|box-shadow|z-index)\s*:\s*([^;}]+)/g
    )) {
      if (
        !match[2].includes('var(--') &&
        !['inherit', 'transparent', 'none', 'currentColor'].includes(
          match[2].trim()
        )
      )
        violations.push(`${path}: ${match[1]} must use semantic tokens`);
    }
  }
}
if (violations.length) {
  console.error(violations.join('\n'));
  process.exitCode = 1;
} else console.log('Portal semantic token scan passed.');
