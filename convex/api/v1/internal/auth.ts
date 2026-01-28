import { internalQuery, internalMutation } from '../../../_generated/server';
import { components } from '../../../_generated/api';
import { v } from 'convex/values';
import { authComponent, AuthUserId } from '../../../auth';
import type { Id } from '../../../_generated/dataModel';

/**
 * Internal queries for the REST API
 * These are used by the API middleware and routes for authentication and authorization
 */

// Type for API key record from Better Auth
interface ApiKeyRecord {
  _id: string;
  userId: string;
  start?: string | null;
  expiresAt?: number | null;
  enabled?: boolean | null;
}

/**
 * Validate an API key and return user information
 * Uses internalMutation to access ctx.runQuery for the Better Auth adapter
 */
export const validateApiKey = internalMutation({
  args: {
    apiKey: v.string(),
  },
  handler: async (
    ctx,
    { apiKey }
  ): Promise<
    { userId: string; personId: Id<'persons'> } | { error: string }
  > => {
    try {
      // Better Auth's apiKey plugin stores keys in the 'apikey' table
      // The table has: id, name, start, key (hashed), userId, expiresAt, createdAt, etc.
      // The 'start' field contains the first 10 characters of the key for lookup

      const keyPrefix = apiKey.substring(0, 10);

      // Query the apikey table using Better Auth's adapter
      // This properly accesses the component's tables with correct typing
      const apiKeysResult = await ctx.runQuery(
        components.betterAuth.adapter.findMany,
        {
          model: 'apikey',
          where: [{ field: 'start', operator: 'eq', value: keyPrefix }],
          paginationOpts: { cursor: null, numItems: 1 },
        }
      );

      const apiKeyRecord = apiKeysResult.page?.[0] as ApiKeyRecord | undefined;

      if (!apiKeyRecord) {
        return { error: 'Invalid API key.' };
      }

      // Check expiration
      if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < Date.now()) {
        return { error: 'API key has expired.' };
      }

      // Check if key is enabled (if the field exists)
      if (apiKeyRecord.enabled === false) {
        return { error: 'API key is disabled.' };
      }

      // Get the person record for this user
      const person = await ctx.db
        .query('persons')
        .withIndex('by_user_id', q => q.eq('userId', apiKeyRecord.userId))
        .first();

      if (!person) {
        return { error: 'User account not found.' };
      }

      return {
        userId: apiKeyRecord.userId,
        personId: person._id,
      };
    } catch (error) {
      console.error('API key validation error:', error);
      return { error: 'Authentication error.' };
    }
  },
});

/**
 * Get event membership for a person
 */
export const getEventMembership = internalQuery({
  args: {
    eventId: v.string(),
    personId: v.string(),
  },
  handler: async (ctx, { eventId, personId }) => {
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q
          .eq('personId', personId as Id<'persons'>)
          .eq('eventId', eventId as Id<'events'>)
      )
      .first();

    if (!membership) {
      return null;
    }

    return {
      membershipId: membership._id,
      role: membership.role,
    };
  },
});

/**
 * Check if a person can modify a post (author or moderator+)
 */
export const canModifyPost = internalQuery({
  args: {
    postId: v.string(),
    personId: v.string(),
  },
  handler: async (ctx, { postId, personId }) => {
    const post = await ctx.db.get(postId as Id<'posts'>);
    if (!post) {
      return false;
    }

    // Check if user is the author
    if (post.authorId === personId) {
      return true;
    }

    // Check if user has moderator+ role in the event
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', personId as Id<'persons'>).eq('eventId', post.eventId)
      )
      .first();

    if (!membership) {
      return false;
    }

    return membership.role === 'ORGANIZER' || membership.role === 'MODERATOR';
  },
});

/**
 * Check if a person can modify a reply (author or moderator+)
 */
export const canModifyReply = internalQuery({
  args: {
    replyId: v.string(),
    personId: v.string(),
  },
  handler: async (ctx, { replyId, personId }) => {
    const reply = await ctx.db.get(replyId as Id<'replies'>);
    if (!reply) {
      return false;
    }

    // Check if user is the author
    if (reply.authorId === personId) {
      return true;
    }

    // Get the post to find the event
    const post = await ctx.db.get(reply.postId);
    if (!post) {
      return false;
    }

    // Check if user has moderator+ role in the event
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', personId as Id<'persons'>).eq('eventId', post.eventId)
      )
      .first();

    if (!membership) {
      return false;
    }

    return membership.role === 'ORGANIZER' || membership.role === 'MODERATOR';
  },
});

/**
 * Get person by user ID
 */
export const getPersonByUserId = internalQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const person = await ctx.db
      .query('persons')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .first();

    if (!person) {
      return null;
    }

    // Get user info from Better Auth
    const user = await authComponent.getAnyUserById(ctx, userId as AuthUserId);

    return {
      person: {
        id: person._id,
        userId: person.userId,
        bio: person.bio ?? null,
        pronouns: person.pronouns ?? null,
      },
      user: user
        ? {
            id: user._id,
            name: user.name ?? null,
            email: user.email,
            image: user.image ?? null,
            username: (user as { username?: string }).username ?? null,
          }
        : null,
    };
  },
});
