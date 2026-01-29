import { query } from '../_generated/server';
import { v } from 'convex/values';
import {
  authComponent,
  getCurrentUserAndPerson as getAuthUserAndPerson,
  isAdmin,
  AuthUserId,
  ExtendedAuthUser,
} from '../auth';

/**
 * Client-accessible auth queries
 *
 * These queries allow client components to check authentication status
 * and user information for conditional rendering.
 */

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export const getCurrentUser = query({
  args: {
    _traceId: v.optional(v.string()),
  },
  handler: async ctx => {
    return await authComponent.getAuthUser(ctx);
  },
});

/**
 * Get current user and person records
 * Returns null if not authenticated
 */
export const getCurrentUserAndPerson = query({
  args: {
    _traceId: v.optional(v.string()),
  },
  handler: async ctx => {
    return await getAuthUserAndPerson(ctx);
  },
});

/**
 * Check if current user is an admin
 * Returns false if not authenticated
 */
export const isCurrentUserAdmin = query({
  args: {
    _traceId: v.optional(v.string()),
  },
  handler: async ctx => {
    return await isAdmin(ctx);
  },
});

/**
 * Get email for a username (public query for magic link login)
 * Note: Username lookup must be done via Better Auth client-side API
 * as we don't have direct access to the users table
 */
export const getEmailForUsername = query({
  args: {
    username: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { username }) => {
    const searchUsername = username.toLowerCase();

    // Get all persons and find the one with matching username
    const persons = await ctx.db.query('persons').collect();

    for (const person of persons) {
      const user = await authComponent.getAnyUserById(
        ctx,
        person.userId as AuthUserId
      );
      if (
        user &&
        (user as ExtendedAuthUser).username?.toLowerCase() === searchUsername
      ) {
        return { email: user.email };
      }
    }

    return null;
  },
});
