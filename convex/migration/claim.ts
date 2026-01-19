/**
 * Account claiming mutations - allows users to link their new Better Auth
 * account to their legacy Supabase/Clerk data.
 */

import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { requireAuthUser } from '../auth';

/**
 * Check if a legacy account exists with the given username.
 */
export const checkLegacyAccount = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, { username }) => {
    // Look for a person with a legacy userId that contains this username
    const legacyPrefix = 'legacy:';

    // Get all persons to search for legacy accounts
    const persons = await ctx.db.query('persons').collect();

    const legacyPerson = persons.find(p => {
      if (!p.userId.startsWith(legacyPrefix)) return false;
      // Format: legacy:clerk_id:username
      const parts = p.userId.split(':');
      return parts.length >= 3 && parts[2] === username;
    });

    if (!legacyPerson) {
      return { found: false };
    }

    // Check if this account has any data associated with it
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_person', q => q.eq('personId', legacyPerson._id))
      .collect();

    const events = await ctx.db
      .query('events')
      .withIndex('by_creator', q => q.eq('creatorId', legacyPerson._id))
      .collect();

    return {
      found: true,
      bio: legacyPerson.bio,
      membershipCount: memberships.length,
      eventsCreated: events.length,
    };
  },
});

/**
 * Claim a legacy account by linking it to the current Better Auth user.
 * This updates the legacy person record to use the new Better Auth user ID.
 */
export const claimLegacyAccount = mutation({
  args: {
    username: v.string(),
  },
  handler: async (ctx, { username }) => {
    // Get the current authenticated user
    const { userId, user } = await requireAuthUser(ctx);

    // Check if user already has a person record
    const existingPerson = await ctx.db
      .query('persons')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .first();

    if (existingPerson && !existingPerson.userId.startsWith('legacy:')) {
      throw new Error('You already have an account. Cannot claim another.');
    }

    // Find the legacy person by username
    const legacyPrefix = 'legacy:';
    const persons = await ctx.db.query('persons').collect();

    const legacyPerson = persons.find(p => {
      if (!p.userId.startsWith(legacyPrefix)) return false;
      const parts = p.userId.split(':');
      return parts.length >= 3 && parts[2] === username;
    });

    if (!legacyPerson) {
      throw new Error(`No legacy account found with username: ${username}`);
    }

    // Update the legacy person to use the new Better Auth user ID
    await ctx.db.patch(legacyPerson._id, {
      userId: userId,
      // Optionally update bio with their full name from Better Auth
      bio: legacyPerson.bio || user.name || undefined,
    });

    // If there was a newly created person record from Better Auth signup,
    // we need to merge or delete it
    if (existingPerson && existingPerson._id !== legacyPerson._id) {
      // Check if the new person has any data
      const newPersonMemberships = await ctx.db
        .query('memberships')
        .withIndex('by_person', q => q.eq('personId', existingPerson._id))
        .collect();

      if (newPersonMemberships.length === 0) {
        // Safe to delete the empty new person record
        const newPersonSettings = await ctx.db
          .query('personSettings')
          .withIndex('by_person', q => q.eq('personId', existingPerson._id))
          .first();

        if (newPersonSettings) {
          await ctx.db.delete(newPersonSettings._id);
        }

        await ctx.db.delete(existingPerson._id);
      } else {
        // The new account has data - this shouldn't normally happen
        // but we'll keep both for now and log a warning
        console.warn(
          `User ${userId} claimed legacy account but also has new data. ` +
            `Legacy: ${legacyPerson._id}, New: ${existingPerson._id}`
        );
      }
    }

    console.log(
      `User ${userId} claimed legacy account with username: ${username}`
    );

    return {
      success: true,
      personId: legacyPerson._id,
    };
  },
});

/**
 * Check if the current user has an unclaimed legacy account based on email.
 * This requires the Clerk user export to be loaded.
 */
export const findLegacyAccountByEmail = query({
  args: {},
  handler: async _ctx => {
    // This would require matching against a loaded email mapping
    // For now, users must claim by username
    return {
      found: false,
      message: 'Please use your username to claim your account',
    };
  },
});
