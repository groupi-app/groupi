import { internalQuery, internalMutation } from '../../../_generated/server';
import { components } from '../../../_generated/api';
import { v } from 'convex/values';
import { authComponent, AuthUserId } from '../../../auth';
import type { Id } from '../../../_generated/dataModel';
import type { Doc as AuthDoc } from '../../../betterAuth/_generated/dataModel';

/**
 * Internal authentication and authorization for the REST API
 * These are used by the API middleware and routes for authentication and authorization
 */

async function hashApiKey(raw: string): Promise<string> {
  const data = new TextEncoder().encode(raw);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hash);
  const b64 = btoa(String.fromCharCode(...bytes));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Validate an API key by hashing it and looking up the hash
 * in the Better Auth component's apikey table. Quota updates share this mutation
 * transaction so concurrent requests cannot spend the same remaining use.
 *
 * Better Auth maps referenceId to the component's existing userId column.
 * This verifier therefore accepts legacy keys and newly issued CLI keys alike.
 *
 * This matches Better Auth's own lookup: hash with SHA-256,
 * encode as base64url, query by the `key` field.
 */
export const validateApiKey = internalMutation({
  args: {
    apiKey: v.string(),
    resource: v.string(),
    action: v.union(v.literal('read'), v.literal('write')),
    selfRevoke: v.optional(v.boolean()),
  },
  returns: v.union(
    v.object({ userId: v.string(), personId: v.id('persons') }),
    v.object({
      error: v.string(),
      status: v.optional(
        v.union(v.literal(401), v.literal(403), v.literal(429))
      ),
      retryAfter: v.optional(v.number()),
    })
  ),
  handler: async (ctx, { apiKey, resource, action, selfRevoke }) => {
    try {
      const hashedKey = await hashApiKey(apiKey);

      const findFn = components.betterAuth.adapter.findMany;
      const result = await ctx.runQuery(findFn, {
        model: 'apikey',
        where: [{ field: 'key', operator: 'eq', value: hashedKey }],
        paginationOpts: { cursor: null, numItems: 1 },
      });

      const record = result.page?.[0] as AuthDoc<'apikey'> | undefined;

      if (!record) {
        return { error: 'Invalid API key.' };
      }

      if (record.enabled === false) {
        return { error: 'API key is disabled.' };
      }

      if (record.expiresAt != null && record.expiresAt <= Date.now()) {
        return { error: 'API key has expired.' };
      }

      if (!selfRevoke && record.permissions != null) {
        let permissions: unknown;
        try {
          permissions = JSON.parse(record.permissions);
        } catch {
          return {
            error: 'Invalid API key permissions.',
            status: 403 as const,
          };
        }
        if (
          typeof permissions !== 'object' ||
          permissions === null ||
          Array.isArray(permissions)
        ) {
          return {
            error: 'Invalid API key permissions.',
            status: 403 as const,
          };
        }
        const entries = Object.entries(permissions);
        if (
          !entries.every(
            ([, actions]) =>
              Array.isArray(actions) &&
              actions.every(value => typeof value === 'string')
          )
        ) {
          return {
            error: 'Invalid API key permissions.',
            status: 403 as const,
          };
        }
        const allowed = entries.find(([name]) => name === resource)?.[1];
        if (!Array.isArray(allowed) || !allowed.includes(action)) {
          return {
            error: 'API key does not permit this resource and action.',
            status: 403 as const,
          };
        }
      }

      const user = await authComponent.getAnyUserById(
        ctx,
        record.userId as AuthUserId
      );
      if (!user) return { error: 'User account not found.' };
      if (
        user.banned &&
        (user.banExpires == null || user.banExpires > Date.now())
      ) {
        return { error: 'User account is banned.' };
      }

      const person = await ctx.db
        .query('persons')
        .withIndex('by_user_id', q => q.eq('userId', record.userId))
        .first();

      if (!person) {
        return { error: 'User account not found.' };
      }

      // Revoking the presented secret remains possible after its quota is spent.
      if (selfRevoke) return { userId: record.userId, personId: person._id };

      const now = Date.now();
      const update: Partial<AuthDoc<'apikey'>> = {};
      if (record.remaining != null) {
        const canRefill =
          record.refillInterval != null &&
          record.refillInterval > 0 &&
          record.refillAmount != null &&
          record.refillAmount > 0 &&
          now - (record.lastRefillAt ?? record.createdAt) >=
            record.refillInterval;
        const remaining = canRefill ? record.refillAmount! : record.remaining;
        if (remaining <= 0)
          return {
            error: 'API key usage limit exceeded.',
            status: 429 as const,
          };
        update.remaining = remaining - 1;
        if (canRefill) update.lastRefillAt = now;
      }
      if (
        record.rateLimitEnabled !== false &&
        record.rateLimitMax != null &&
        record.rateLimitTimeWindow != null
      ) {
        const elapsed = now - (record.lastRequest ?? 0);
        const count =
          record.lastRequest != null && elapsed < record.rateLimitTimeWindow
            ? (record.requestCount ?? 0)
            : 0;
        if (count >= record.rateLimitMax) {
          return {
            error: 'API key rate limit exceeded.',
            status: 429 as const,
            retryAfter: Math.max(
              1,
              Math.ceil((record.rateLimitTimeWindow - elapsed) / 1000)
            ),
          };
        }
        update.requestCount = count + 1;
        update.lastRequest = now;
      }
      if (Object.keys(update).length > 0) {
        await ctx.runMutation(components.betterAuth.adapter.updateOne, {
          input: {
            model: 'apikey',
            where: [{ field: '_id', value: record._id }],
            update: { ...update, updatedAt: now },
          },
        });
      }

      return {
        userId: record.userId,
        personId: person._id,
      };
    } catch {
      console.error('API key validation failed');
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
