/**
 * Auto-generated changelog data from CHANGELOG.md
 * DO NOT EDIT DIRECTLY - Run 'pnpm generate:changelog' to regenerate
 *
 * Generated: 2026-02-24T20:56:01.905Z
 */

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: ChangelogSection[];
}

export interface ChangelogSection {
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

export const changelog: ChangelogEntry[] = [
  {
    version: '0.1.0',
    date: 'Initial Release',
    changes: [
      {
        type: 'general',
        items: ['Initial development version of Groupi.'],
      },
    ],
  },
];
