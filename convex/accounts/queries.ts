import { query, action, internalQuery } from '../_generated/server';
import { components } from '../_generated/api';
import { authComponent } from '../auth';

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
 * Internal query to get accounts with tokens for Discord username fetching
 */
export const getAccountsWithTokens = internalQuery({
  args: {},
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
          accessToken?: string | null;
          createdAt: number;
        }) => ({
          id: account._id,
          providerId: account.providerId,
          accountId: account.accountId,
          accessToken: account.accessToken,
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
  accessToken: string
): Promise<string | null> {
  try {
    const response = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.log('[Discord API] Failed to fetch user:', response.status);
      return null;
    }

    const data = await response.json();
    // Discord returns username (new format) or username#discriminator (old format)
    return data.username || null;
  } catch (error) {
    console.error('[Discord API] Error fetching user:', error);
    return null;
  }
}

type AccountWithToken = {
  id: string;
  providerId: string;
  accountId: string;
  accessToken?: string | null;
  createdAt: number;
};

type EnrichedAccount = {
  id: string;
  providerId: string;
  accountId: string;
  username?: string;
  createdAt: number;
};

/**
 * Action to get linked accounts with enriched Discord usernames
 * Uses Discord API to fetch the actual username
 */
export const getLinkedAccountsWithUsernames = action({
  args: {},
  handler: async (ctx): Promise<EnrichedAccount[]> => {
    const data = await ctx.runQuery(
      internalApi.accounts.queries.getAccountsWithTokens,
      {}
    );

    if (!data.user) {
      return [];
    }

    // Enrich accounts with usernames
    const enrichedAccounts: EnrichedAccount[] = await Promise.all(
      data.accounts.map(async (account: AccountWithToken) => {
        let username: string | undefined;

        if (account.providerId === 'google') {
          // For Google, use user's email
          username = data.user?.email;
        } else if (account.providerId === 'discord' && account.accessToken) {
          // For Discord, fetch username from Discord API
          const discordUsername = await fetchDiscordUsername(
            account.accessToken
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
