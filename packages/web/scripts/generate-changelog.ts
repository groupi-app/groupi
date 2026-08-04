/**
 * Changelog Generation Script
 *
 * Reads CHANGELOG.md from the repository root and generates a TypeScript
 * data file that can be imported by the changelog page.
 *
 * This ensures the changelog page stays automatically in sync with
 * CHANGELOG.md which is updated by Changesets on each release.
 *
 * Usage: npx tsx scripts/generate-changelog.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ChangelogEntry {
  version: string;
  date: string;
  changes: ChangelogSection[];
}

interface ChangelogSection {
  type:
    | 'added'
    | 'changed'
    | 'deprecated'
    | 'removed'
    | 'fixed'
    | 'security'
    | 'general';
  items: string[];
}

function parseChangelog(content: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  const lines = content.split('\n');

  let currentEntry: ChangelogEntry | null = null;
  let currentSection: ChangelogSection | null = null;

  const sectionTypeMap: Record<string, ChangelogSection['type']> = {
    added: 'added',
    changed: 'changed',
    deprecated: 'deprecated',
    removed: 'removed',
    fixed: 'fixed',
    security: 'security',
    'minor changes': 'added',
    'major changes': 'changed',
    'patch changes': 'fixed',
  };

  for (const line of lines) {
    // Match version headers:
    //   Keep a Changelog: "## [0.1.0] - Initial Release" or "## [1.2.3] - 2024-01-15"
    //   Changesets:        "## 0.2.0"
    const versionMatch =
      line.match(/^## \[([^\]]+)\](?: - (.+))?/) ||
      line.match(/^## (\d+\.\d+\.\d+[^\s]*)\s*$/);
    if (versionMatch) {
      if (currentEntry) {
        if (currentSection && currentSection.items.length > 0) {
          currentEntry.changes.push(currentSection);
        }
        entries.push(currentEntry);
      }

      currentEntry = {
        version: versionMatch[1],
        date: versionMatch[2] || '',
        changes: [],
      };
      currentSection = { type: 'general', items: [] };
      continue;
    }

    // Match section headers (Keep a Changelog and Changesets formats)
    const sectionMatch = line.match(
      /^### (Added|Changed|Deprecated|Removed|Fixed|Security|Minor Changes|Major Changes|Patch Changes)/i
    );
    if (sectionMatch && currentEntry) {
      if (currentSection && currentSection.items.length > 0) {
        currentEntry.changes.push(currentSection);
      }
      const key = sectionMatch[1].toLowerCase();
      currentSection = {
        type: sectionTypeMap[key] ?? 'general',
        items: [],
      };
      continue;
    }

    // Match list items, stripping optional commit hash prefix (e.g. "abc1234: ")
    const itemMatch = line.match(/^[-*] (.+)/);
    if (itemMatch && currentSection) {
      const text = itemMatch[1].replace(/^[0-9a-f]{7}: /, '');
      currentSection.items.push(text);
      continue;
    }

    // Handle non-sectioned content (like "Initial development version of Groupi.")
    if (
      currentEntry &&
      currentSection &&
      line.trim() &&
      !line.startsWith('#')
    ) {
      currentSection.items.push(line.trim());
    }
  }

  // Don't forget the last entry
  if (currentEntry) {
    if (currentSection && currentSection.items.length > 0) {
      currentEntry.changes.push(currentSection);
    }
    entries.push(currentEntry);
  }

  return entries;
}

function generateTypeScriptFile(entries: ChangelogEntry[]): string {
  return `/**
 * Auto-generated changelog data from CHANGELOG.md
 * DO NOT EDIT DIRECTLY - Run 'pnpm generate:changelog' to regenerate
 *
 * Generated: ${new Date().toISOString()}
 */

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: ChangelogSection[];
}

export interface ChangelogSection {
  type: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security' | 'general';
  items: string[];
}

export const changelog: ChangelogEntry[] = ${JSON.stringify(entries, null, 2)};
`;
}

function main() {
  const repoRoot = path.resolve(__dirname, '../../..');
  const outputPath = path.resolve(__dirname, '../lib/_generated-changelog.ts');

  // Changesets writes per-package CHANGELOGs. Read from packages/web first
  // (the user-facing app), then fall back to the root CHANGELOG.md.
  const packageChangelog = path.join(repoRoot, 'packages/web/CHANGELOG.md');
  const rootChangelog = path.join(repoRoot, 'CHANGELOG.md');

  let entries: ChangelogEntry[] = [];

  if (fs.existsSync(packageChangelog)) {
    const content = fs.readFileSync(packageChangelog, 'utf-8');
    entries = parseChangelog(content);
  }

  // Merge in root CHANGELOG entries that aren't already present (e.g. 0.1.0 initial)
  if (fs.existsSync(rootChangelog)) {
    const rootContent = fs.readFileSync(rootChangelog, 'utf-8');
    const rootEntries = parseChangelog(rootContent);
    const existingVersions = new Set(entries.map(e => e.version));
    for (const entry of rootEntries) {
      if (!existingVersions.has(entry.version)) {
        entries.push(entry);
      }
    }
  }

  if (entries.length === 0) {
    console.error(
      'No changelog entries found in:',
      packageChangelog,
      'or',
      rootChangelog
    );
    process.exit(1);
  }

  const output = generateTypeScriptFile(entries);

  const libDir = path.dirname(outputPath);
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, output, 'utf-8');
  console.log(
    `Generated changelog with ${entries.length} entries to ${outputPath}`
  );
}

main();
