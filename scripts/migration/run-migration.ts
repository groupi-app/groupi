#!/usr/bin/env npx tsx
/**
 * Run Migration Script
 *
 * This script reads the parsed data and triggers the Convex migration action.
 *
 * Usage:
 *   npx tsx scripts/migration/run-migration.ts [--clear]
 *
 * Options:
 *   --clear   Clear existing data before migration
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const __dirname = new URL('.', import.meta.url).pathname;

async function main() {
  const clearFirst = process.argv.includes('--clear');

  console.log('='.repeat(60));
  console.log('Supabase to Convex Migration Runner');
  console.log('='.repeat(60));

  // Check for parsed data
  const parsedDataPath = path.join(__dirname, 'parsed-data.json');
  if (!fs.existsSync(parsedDataPath)) {
    console.error('\nError: parsed-data.json not found.');
    console.error('Run: npx tsx scripts/migration/parse-sql-dump.ts');
    process.exit(1);
  }

  console.log('\nReading parsed data...');
  const parsedData = JSON.parse(fs.readFileSync(parsedDataPath, 'utf-8'));

  console.log(`\nData summary:`);
  console.log(`  - ${parsedData.persons.length} persons`);
  console.log(`  - ${parsedData.events.length} events`);
  console.log(`  - ${parsedData.memberships.length} memberships`);
  console.log(
    `  - ${parsedData.potentialDateTimes.length} potential date times`
  );
  console.log(`  - ${parsedData.availabilities.length} availabilities`);
  console.log(`  - ${parsedData.posts.length} posts`);
  console.log(`  - ${parsedData.replies.length} replies`);
  console.log(`  - ${parsedData.invites.length} invites`);
  console.log(`  - ${parsedData.notifications.length} notifications`);

  if (clearFirst) {
    console.log(
      '\n⚠️  WARNING: --clear flag set. Existing data will be deleted.'
    );
  }

  console.log('\n\nTo run the migration:');
  console.log('1. Open the Convex Dashboard: https://dashboard.convex.dev');
  console.log('2. Navigate to your deployment');
  console.log('3. Go to Functions → migration/actions → runMigration');
  console.log('4. Click "Run Function"');
  console.log('5. Set the arguments:');
  console.log(`   - data: (paste contents of ${parsedDataPath})`);
  console.log(`   - clearFirst: ${clearFirst}`);
  console.log('\nAlternatively, use the Convex CLI:');
  console.log('');
  console.log('  npx convex run migration/actions:runMigration \\');
  console.log(
    `    --args '{"data": <contents of parsed-data.json>, "clearFirst": ${clearFirst}}'`
  );
  console.log('');
  console.log(
    'Note: The data is too large for command line. Use the dashboard instead.'
  );

  // Create a smaller test file with just a few records for testing
  const testData = {
    persons: parsedData.persons.slice(0, 3),
    events: parsedData.events.slice(0, 2),
    memberships: parsedData.memberships.filter((m: { eventId: string }) =>
      parsedData.events
        .slice(0, 2)
        .some((e: { id: string }) => e.id === m.eventId)
    ),
    potentialDateTimes: parsedData.potentialDateTimes.filter(
      (pdt: { eventId: string }) =>
        parsedData.events
          .slice(0, 2)
          .some((e: { id: string }) => e.id === pdt.eventId)
    ),
    availabilities: [],
    posts: [],
    replies: [],
    invites: [],
    notifications: [],
    personSettings: parsedData.personSettings.slice(0, 3),
  };

  const testDataPath = path.join(__dirname, 'test-data.json');
  fs.writeFileSync(testDataPath, JSON.stringify(testData, null, 2));
  console.log(`\nCreated ${testDataPath} with subset of data for testing.`);
}

main().catch(console.error);
