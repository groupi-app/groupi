/**
 * Migration helpers for uploading data and running the migration.
 *
 * This provides a way to run the migration from a script by:
 * 1. Uploading migration data to file storage
 * 2. Running the migration action with a reference to that data
 */

import { v } from 'convex/values';
import { action, mutation } from '../_generated/server';
import { internal } from '../_generated/api';

/**
 * Get an upload URL for migration data.
 */
export const getUploadUrl = mutation({
  args: {},
  handler: async ctx => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Migration result type (duplicated here to avoid circular type issues)
 */
interface MigrationResult {
  success: boolean;
  counts: {
    persons: number;
    events: number;
    memberships: number;
    potentialDateTimes: number;
    availabilities: number;
    posts: number;
    replies: number;
    invites: number;
    notifications: number;
    personSettings: number;
  };
  errors: string[];
}

/**
 * Run the migration using data from file storage.
 * This is a public action that can be called from a script.
 */
export const runMigrationFromStorage = action({
  args: {
    storageId: v.id('_storage'),
    clearFirst: v.optional(v.boolean()),
    secret: v.string(),
  },
  handler: async (
    ctx,
    { storageId, clearFirst, secret }
  ): Promise<MigrationResult> => {
    // Validate secret
    const migrationSecret =
      process.env.MIGRATION_SECRET || 'groupi-migration-2024';
    if (secret !== migrationSecret) {
      throw new Error('Invalid migration secret');
    }

    // Get the file from storage
    const blob = await ctx.storage.get(storageId);
    if (!blob) {
      throw new Error('Migration data not found in storage');
    }

    // Parse the JSON data
    const text = await blob.text();
    const data = JSON.parse(text);

    console.log('Loaded migration data from storage');
    console.log(`  Persons: ${data.persons?.length || 0}`);
    console.log(`  Events: ${data.events?.length || 0}`);
    console.log(`  Memberships: ${data.memberships?.length || 0}`);

    // Run the internal migration action
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Known Convex type instantiation depth issue with internal API in web tsconfig
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const migrationAction = internal.migration.actions.runMigration as any;
    const result: MigrationResult = await ctx.runAction(migrationAction, {
      data,
      clearFirst,
    });

    // Optionally delete the uploaded file after migration
    // await ctx.storage.delete(storageId);

    return result;
  },
});

/**
 * Delete uploaded migration data from storage.
 */
export const deleteMigrationData = mutation({
  args: {
    storageId: v.id('_storage'),
  },
  handler: async (ctx, { storageId }) => {
    await ctx.storage.delete(storageId);
    return { success: true };
  },
});

/**
 * Clear all data before migration (separate action to avoid timeout).
 * This must be called before runMigrationFromStorage if you want a clean slate.
 */
export const clearAllDataForMigration = action({
  args: {
    secret: v.string(),
  },
  handler: async (ctx, { secret }): Promise<{ success: boolean }> => {
    // Validate secret
    const migrationSecret =
      process.env.MIGRATION_SECRET || 'groupi-migration-2024';
    if (secret !== migrationSecret) {
      throw new Error('Invalid migration secret');
    }

    console.log('Clearing all data for migration...');

    // Clear app tables in batches
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const batch1 = internal.migration.mutations.clearAppTablesBatch1 as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const batch2 = internal.migration.mutations.clearAppTablesBatch2 as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const batch3 = internal.migration.mutations.clearAppTablesBatch3 as any;

    console.log('  Clearing app tables batch 1...');
    await ctx.runMutation(batch1, {});

    console.log('  Clearing app tables batch 2...');
    await ctx.runMutation(batch2, {});

    console.log('  Clearing app tables batch 3...');
    await ctx.runMutation(batch3, {});

    // Clear Better Auth users in batches (may need multiple calls)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clearUsers = internal.migration.mutations.clearBetterAuthUsers as any;

    const clearSessions =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      internal.migration.mutations.clearBetterAuthSessions as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clearOther = internal.migration.mutations.clearBetterAuthOther as any;

    console.log('  Clearing Better Auth sessions...');
    await ctx.runMutation(clearSessions, {});

    console.log('  Clearing Better Auth accounts and verifications...');
    await ctx.runMutation(clearOther, {});

    console.log('  Clearing Better Auth users (batched)...');
    let hasMore = true;
    let totalDeleted = 0;
    while (hasMore) {
      const result = await ctx.runMutation(clearUsers, { limit: 30 });
      totalDeleted += result.deleted;
      hasMore = result.hasMore;
      if (hasMore) {
        console.log(`    Deleted ${totalDeleted} users so far...`);
      }
    }
    console.log(`  Deleted ${totalDeleted} Better Auth users total`);

    console.log('Data cleared successfully');
    return { success: true };
  },
});
