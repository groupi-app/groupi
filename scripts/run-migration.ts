/**
 * Run the Convex migration by uploading data and triggering the migration action.
 *
 * Usage:
 *   npx tsx scripts/run-migration.ts [--clear-first] [--prod]
 *
 * Prerequisites:
 *   1. Run parse-supabase-dump.ts first to generate migration_data.json
 *   2. Ensure you're logged into Convex
 */

import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import * as fs from 'fs';
import * as path from 'path';

// Define function references as strings to avoid ESM import issues
const getUploadUrl = makeFunctionReference<
  'mutation',
  Record<string, never>,
  string
>('migration/uploadAndMigrate:getUploadUrl');

const runMigrationFromStorage = makeFunctionReference<
  'action',
  { storageId: string; clearFirst?: boolean; secret: string },
  {
    success: boolean;
    counts: Record<string, number>;
    errors: string[];
  }
>('migration/uploadAndMigrate:runMigrationFromStorage');

const deleteMigrationData = makeFunctionReference<
  'mutation',
  { storageId: string },
  { success: boolean }
>('migration/uploadAndMigrate:deleteMigrationData');

const clearAllDataForMigration = makeFunctionReference<
  'action',
  { secret: string },
  { success: boolean }
>('migration/uploadAndMigrate:clearAllDataForMigration');

async function main() {
  const args = process.argv.slice(2);
  const clearFirst = args.includes('--clear-first');
  const useProd = args.includes('--prod');

  const dataPath = path.join(process.cwd(), 'migration_data.json');

  if (!fs.existsSync(dataPath)) {
    console.error('migration_data.json not found!');
    console.error(
      'Run: npx tsx scripts/parse-supabase-dump.ts --clerk-export clerk_users.csv'
    );
    process.exit(1);
  }

  console.log('Loading migration data...');
  const dataContent = fs.readFileSync(dataPath, 'utf-8');
  const data = JSON.parse(dataContent);

  // Validate data
  const personsWithEmail = data.persons.filter(
    (p: { email: string }) => p.email
  );
  if (personsWithEmail.length === 0) {
    console.error('No persons have email addresses!');
    process.exit(1);
  }

  console.log(`Migration data summary:
  - ${personsWithEmail.length}/${data.persons.length} persons (with email)
  - ${data.events.length} events
  - ${data.memberships.length} memberships
  - ${data.potentialDateTimes.length} potential date times
  - ${data.availabilities.length} availabilities
  - ${data.posts.length} posts
  - ${data.replies.length} replies
  - ${data.invites.length} invites
  - ${data.notifications.length} notifications
  - ${data.personSettings.length} person settings`);

  // Determine Convex URL
  let convexUrl: string;
  if (useProd) {
    convexUrl = process.env.CONVEX_PROD_URL || '';
    if (!convexUrl) {
      console.error(
        'CONVEX_PROD_URL environment variable required for production migration'
      );
      process.exit(1);
    }
  } else {
    convexUrl =
      process.env.CONVEX_DEV_URL || process.env.NEXT_PUBLIC_CONVEX_URL || '';
    if (!convexUrl) {
      // Try to read from .env.local
      const envPath = path.join(process.cwd(), 'packages/web/.env.local');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const match = envContent.match(/NEXT_PUBLIC_CONVEX_URL=(.+)/);
        if (match) {
          convexUrl = match[1].trim();
        }
      }
    }
  }

  if (!convexUrl) {
    console.error('Could not determine Convex URL');
    console.error('Set CONVEX_DEV_URL or CONVEX_PROD_URL environment variable');
    process.exit(1);
  }

  console.log(`\n🎯 Target: ${useProd ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`📍 URL: ${convexUrl}`);
  console.log(`🗑️  Clear existing data: ${clearFirst}`);

  if (useProd) {
    console.log('\n⚠️  WARNING: You are about to migrate to PRODUCTION!\n');
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>(resolve => {
      rl.question('Type "MIGRATE PRODUCTION" to confirm: ', resolve);
    });
    rl.close();

    if (answer !== 'MIGRATE PRODUCTION') {
      console.log('Migration cancelled.');
      process.exit(0);
    }
  }

  const client = new ConvexHttpClient(convexUrl);
  const migrationSecret =
    process.env.MIGRATION_SECRET || 'groupi-migration-2024';

  // Step 1: Clear data if requested (separate call to avoid timeout)
  if (clearFirst) {
    console.log('\n🗑️  Step 1: Clearing existing data...');
    console.log('   (This may take a while...)');
    try {
      await client.action(clearAllDataForMigration, {
        secret: migrationSecret,
      });
      console.log('   ✅ Data cleared successfully');
    } catch (error) {
      console.error('   ❌ Failed to clear data:', error);
      process.exit(1);
    }
  }

  console.log('\n📤 Step 2: Getting upload URL...');
  const uploadUrl = await client.mutation(getUploadUrl, {});
  console.log('   Got upload URL');

  console.log('\n📤 Step 3: Uploading migration data...');
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: dataContent,
  });

  if (!uploadResponse.ok) {
    console.error(
      'Failed to upload migration data:',
      await uploadResponse.text()
    );
    process.exit(1);
  }

  const { storageId } = await uploadResponse.json();
  console.log(`   Uploaded to storage: ${storageId}`);

  console.log('\n🚀 Step 4: Running migration...');

  try {
    // Don't pass clearFirst since we already cleared the data
    const result = await client.action(runMigrationFromStorage, {
      storageId,
      clearFirst: false,
      secret: migrationSecret,
    });

    console.log('\n✅ Migration completed!');
    console.log('Results:', JSON.stringify(result, null, 2));

    // Clean up the uploaded file
    console.log('\n🧹 Cleaning up uploaded data...');
    await client.mutation(deleteMigrationData, { storageId });
    console.log('   Deleted migration data from storage');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);

    // Still try to clean up
    try {
      await client.mutation(deleteMigrationData, { storageId });
      console.log('   Cleaned up uploaded data');
    } catch {
      console.log('   Failed to clean up uploaded data');
    }

    process.exit(1);
  }

  console.log('\n🎉 Migration complete!');
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
