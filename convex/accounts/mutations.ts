import { mutation } from '../_generated/server';
import { components } from '../_generated/api';
import { v, ConvexError } from 'convex/values';
import { authComponent } from '../auth';

/**
 * Account mutations for managing linked OAuth accounts
 *
 * Note: Account data is managed by Better Auth component.
 * These mutations access the component's account table via internal functions.
 */

/**
 * Get account count for validation purposes
 * Returns basic info about the authenticated user
 */
export const getAccountInfo = mutation({
  args: {},
  handler: async ctx => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return { authenticated: false, hasEmail: false };
    }

    return {
      authenticated: true,
      hasEmail: !!(user.email && user.emailVerified),
      email: user.email,
    };
  },
});

/**
 * Unlink an OAuth account from the current user
 * Ensures user has at least one other authentication method
 */
export const unlinkAccount = mutation({
  args: {
    accountId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new ConvexError('Authentication required');
    }

    const userId = user._id.toString();

    // Get all accounts for this user
    const result = await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: 'account' as const,
      where: [{ field: 'userId', operator: 'eq' as const, value: userId }],
      paginationOpts: {
        cursor: null,
        numItems: 100,
      },
    });

    // findMany returns paginated result with page array
    const accounts = Array.isArray(result) ? result : (result?.page ?? []);

    // Find the account to unlink
    const accountToUnlink = accounts.find(
      (a: { _id: string }) => a._id === args.accountId
    );

    if (!accountToUnlink) {
      throw new ConvexError('Account not found or does not belong to you');
    }

    // Check if user has other authentication methods
    const hasPassword = accounts.some(
      (a: { password?: string | null }) => a.password
    );
    const otherOAuthAccounts = accounts.filter(
      (a: { _id: string; password?: string | null }) =>
        a._id !== args.accountId && !a.password
    );

    // User must have at least one auth method remaining
    const hasVerifiedEmail = user.emailVerified;
    const willHaveAuthMethod =
      hasPassword || otherOAuthAccounts.length > 0 || hasVerifiedEmail;

    if (!willHaveAuthMethod) {
      throw new ConvexError(
        'Cannot unlink last authentication method. Add another sign-in method first.'
      );
    }

    // Delete the account using the component's adapter
    await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
      input: {
        model: 'account' as const,
        where: [{ field: '_id', operator: 'eq', value: args.accountId }],
      },
    });

    return { success: true };
  },
});
