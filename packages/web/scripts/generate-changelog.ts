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

  for (const line of lines) {
    // Match version headers like "## [0.1.0] - Initial Release" or "## [1.2.3] - 2024-01-15"
    const versionMatch = line.match(/^## \[([^\]]+)\](?: - (.+))?/);
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

    // Match section headers like "### Added", "### Fixed", etc.
    const sectionMatch = line.match(
      /^### (Added|Changed|Deprecated|Removed|Fixed|Security)/i
    );
    if (sectionMatch && currentEntry) {
      if (currentSection && currentSection.items.length > 0) {
        currentEntry.changes.push(currentSection);
      }
      currentSection = {
        type: sectionMatch[1].toLowerCase() as ChangelogSection['type'],
        items: [],
      };
      continue;
    }

    // Match list items
    const itemMatch = line.match(/^[-*] (.+)/);
    if (itemMatch && currentSection) {
      currentSection.items.push(itemMatch[1]);
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
  // Read CHANGELOG.md from repo root (two levels up from scripts/)
  const changelogPath = path.resolve(__dirname, '../../../CHANGELOG.md');
  const outputPath = path.resolve(__dirname, '../lib/_generated-changelog.ts');

  if (!fs.existsSync(changelogPath)) {
    console.error('CHANGELOG.md not found at:', changelogPath);
    process.exit(1);
  }

  const content = fs.readFileSync(changelogPath, 'utf-8');
  const entries = parseChangelog(content);
  const output = generateTypeScriptFile(entries);

  // Ensure lib directory exists
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
