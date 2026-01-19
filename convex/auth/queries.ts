import { query } from '../_generated/server';
import { v } from 'convex/values';
import {
  authComponent,
  getCurrentUserAndPerson as getAuthUserAndPerson,
  isAdmin,
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
  handler: async (_ctx, { username }) => {
    // Better Auth component doesn't expose user lookup by username
    // This must be implemented via Better Auth's client-side username plugin
    // Return null to indicate lookup must happen client-side
    console.log(
      `Username lookup for "${username}" must be done via Better Auth client`
    );
    return null;
  },
});
