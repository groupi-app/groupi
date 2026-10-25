import {
  query,
  action,
  internalQuery,
  type ActionCtx,
} from '../_generated/server';
import { components } from '../_generated/api';
import { authComponent } from '../auth';
import { fetchDiscordUserApi } from '../discord/userApi';
import { v, type Infer } from 'convex/values';

const linkedAccountFields = {
  id: v.string(),
  providerId: v.string(),
  accountId: v.string(),
  createdAt: v.number(),
};
const linkedAccountValidator = v.object(linkedAccountFields);
const enrichedAccountValidator = v.object({
  ...linkedAccountFields,
  username: v.optional(v.string()),
});

// Use require to avoid deep type instantiation errors with internal references
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const internalApi: any = require('../_generated/api').internal;

/**
 * Account queries for managing linked OAuth accounts
 *
 * Note: Account data is managed by Better Auth component.
 * These queries access the component's account table via internal functions.
 */

/**
 * Get current user's account info
 */
export const getCurrentUserInfo = query({
  args: {},
  handler: async ctx => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      email: user.email,
      emailVerified: user.emailVerified,
      name: user.name,
      image: user.image,
    };
  },
});

/**
 * Get all linked OAuth accounts for the current user
 * Returns account info without sensitive tokens
 */
export const getLinkedAccounts = query({
  args: {},
  handler: async ctx => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return [];
    }

    const userId = user._id.toString();

    // Query the Better Auth component's account table
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

    // Map to safe public format (no tokens)
    return accounts.map(
      (account: {
        _id: string;
        providerId: string;
        accountId: string;
        createdAt: number;
      }) => ({
        id: account._id,
        providerId: account.providerId,
        accountId: account.accountId,
        // For Google, use user's email as display name
        // For Discord, username isn't stored in account table - leave empty
        // so the UI can show "Connected" instead
        username: account.providerId === 'google' ? user.email : undefined,
        createdAt: account.createdAt,
      })
    );
  },
});

/**
 * Check which OAuth providers the user has linked
 */
export const hasLinkedProvider = query({
  args: {},
  handler: async ctx => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return { google: false, discord: false };
    }

    const userId = user._id.toString();

    // Query the Better Auth component's account table
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

    const providers = new Set(
      accounts.map((a: { providerId: string }) => a.providerId)
    );

    return {
      google: providers.has('google'),
      discord: providers.has('discord'),
    };
  },
});

/**
 * Internal query for account metadata. Provider tokens stay in Better Auth.
 */
export const getAccountsForEnrichment = internalQuery({
  args: {},
  returns: v.object({
    user: v.union(v.object({ email: v.string() }), v.null()),
    accounts: v.array(linkedAccountValidator),
  }),
  handler: async ctx => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return { user: null, accounts: [] };
    }

    const userId = user._id.toString();

    const result = await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: 'account' as const,
      where: [{ field: 'userId', operator: 'eq' as const, value: userId }],
      paginationOpts: {
        cursor: null,
        numItems: 100,
      },
    });

    const accounts = Array.isArray(result) ? result : (result?.page ?? []);

    return {
      user: { email: user.email },
      accounts: accounts.map(
        (account: {
          _id: string;
          providerId: string;
          accountId: string;
          createdAt: number;
        }) => ({
          id: account._id,
          providerId: account.providerId,
          accountId: account.accountId,
          createdAt: account.createdAt,
        })
      ),
    };
  },
});

/**
 * Fetch Discord username from Discord API
 */
async function fetchDiscordUsername(
  ctx: ActionCtx,
  accountId: string
): Promise<string | null> {
  try {
    const response = await fetchDiscordUserApi(ctx, accountId, '/users/@me');

    if (!response.ok) {
      console.log('[Discord API] Failed to fetch user:', response.status);
      return null;
    }

    const data = await response.json();
    // Discord returns username (new format) or username#discriminator (old format)
    return data.username || null;
  } catch {
    console.error('[Discord API] Unable to retrieve the linked Discord user');
    return null;
  }
}

type LinkedAccount = Infer<typeof linkedAccountValidator>;
type EnrichedAccount = Infer<typeof enrichedAccountValidator>;

/**
 * Action to get linked accounts with enriched Discord usernames
 * Uses Discord API to fetch the actual username
 */
export const getLinkedAccountsWithUsernames = action({
  args: {},
  returns: v.array(enrichedAccountValidator),
  handler: async (ctx): Promise<EnrichedAccount[]> => {
    const data = await ctx.runQuery(
      internalApi.accounts.queries.getAccountsForEnrichment,
      {}
    );

    if (!data.user) {
      return [];
    }

    // Enrich accounts with usernames
    const enrichedAccounts: EnrichedAccount[] = await Promise.all(
      data.accounts.map(async (account: LinkedAccount) => {
        let username: string | undefined;

        if (account.providerId === 'google') {
          // For Google, use user's email
          username = data.user?.email;
        } else if (account.providerId === 'discord') {
          // For Discord, fetch username from Discord API
          const discordUsername = await fetchDiscordUsername(
            ctx,
            account.accountId
          );
          username = discordUsername || undefined;
        }

        return {
          id: account.id,
          providerId: account.providerId,
          accountId: account.accountId,
          username,
          createdAt: account.createdAt,
        };
      })
    );

    return enrichedAccounts;
  },
});
