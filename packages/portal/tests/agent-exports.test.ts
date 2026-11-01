import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vitest';

const publicFile = (path: string) =>
  readFile(resolve(process.cwd(), 'public', path), 'utf8');
test('direct agent Markdown aliases match the versioned integration guide without an HTML fallback', async () => {
  const stable = await publicFile('agents.md');
  const versioned = await publicFile('v2/agents.md');
  expect(stable).toBe(versioned);
  expect(stable).toMatch(/^# Build with Groupi — agent guide/);
  expect(stable).toContain('/v2/agents.md');
  expect(stable).not.toMatch(/<!doctype|pnpm install|git clone/i);
  const discovery = await publicFile('llms.txt');
  expect(discovery).toMatch(/https?:\/\/[^\s)]+\/v2\/agents\.md/);
  expect(discovery).not.toContain('/exports/contributor.md');
  expect(discovery).not.toContain('/exports/architecture.md');
  for (const path of [
    'integrator',
    'event-widget',
    'group-events',
    'event-updates',
    'connect-users',
  ]) {
    expect(discovery).toContain(`/v2/${path}.md`);
    const markdown = await publicFile(`v2/${path}.md`);
    expect(markdown).toContain('Source availability');
    expect(markdown).toContain('## Table of Contents');
    const anchors = [...markdown.matchAll(/^- \[.*\]\(#([^)]*)\)$/gm)].map(
      match => match[1]
    );
    expect(anchors.length).toBeGreaterThanOrEqual(3);
    for (const anchor of anchors)
      expect(markdown).toContain(`<a id="${anchor}"></a>`);
    for (const language of ['typescript', 'python', 'sh'])
      expect(markdown).toContain('```' + language);

    expect(markdown).toMatch(/Canonical (?:passage|document): https?:\/\//);
  }
});
