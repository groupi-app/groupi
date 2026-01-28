/**
 * Parses the Clerk user export CSV and merges it with the Supabase data.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ClerkUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

/**
 * Parse the Clerk CSV export into structured data.
 */
export function parseClerkCsv(filePath: string): ClerkUser[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  // Skip header
  const dataLines = lines.slice(1);

  return dataLines
    .filter(line => line.trim())
    .map(line => {
      // CSV parsing - handle commas in fields
      const fields: string[] = [];
      let current = '';
      let inQuotes = false;

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          fields.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      fields.push(current);

      return {
        id: fields[0],
        firstName: fields[1] || '',
        lastName: fields[2] || '',
        username: fields[3] || '',
        email: fields[4] || '',
      };
    })
    .filter(user => user.id && user.email);
}

/**
 * Create a mapping of Clerk user ID to email.
 */
export function createUserEmailMap(users: ClerkUser[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const user of users) {
    map[user.id] = user.email;
  }
  return map;
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const csvPath =
    process.argv[2] ||
    '/Users/tsurette/Downloads/ins_2gkgKffk4yzRi8mUP2nizXuZReH.csv';

  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  const users = parseClerkCsv(csvPath);
  console.log(`Parsed ${users.length} Clerk users\n`);

  // Show first few users
  console.log('Sample users:');
  users.slice(0, 5).forEach(u => {
    console.log(
      `  ${u.id}: ${u.email} (${u.firstName} ${u.lastName}, @${u.username})`
    );
  });

  // Save to JSON
  const __dirname = new URL('.', import.meta.url).pathname;
  const outputPath = path.join(__dirname, 'clerk-users.json');
  fs.writeFileSync(outputPath, JSON.stringify(users, null, 2));
  console.log(`\nSaved to ${outputPath}`);
}
