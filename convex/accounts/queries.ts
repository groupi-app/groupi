import type { Doc as AuthDoc } from '../betterAuth/_generated/dataModel';
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
  displayName: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
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
    const accounts: AuthDoc<'account'>[] = result.page;

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
    const accounts: AuthDoc<'account'>[] = result.page;

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
    selectedDiscordUserId: v.optional(v.string()),
    managedDiscordIdentityRetired: v.optional(v.boolean()),
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

    const accounts: AuthDoc<'account'>[] = result.page;
    const person = await ctx.db
      .query('persons')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .unique();
    const selected = person
      ? await ctx.db
          .query('groupDiscordManagedIdentities')
          .withIndex('by_person', q => q.eq('personId', person._id))
          .unique()
      : null;

    return {
      managedDiscordIdentityRetired: !!(
        person &&
        selected?.discordUserId &&
        (await ctx.db
          .query('groupDiscordRetiredIdentities')
          .withIndex('by_person_identity', q =>
            q
              .eq('personId', person._id)
              .eq('discordUserId', selected.discordUserId!)
          )
          .unique())
      ),
      selectedDiscordUserId: selected?.discordUserId,
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
 * Fetch safe profile fields for this exact linked Discord identity
 */
async function fetchDiscordProfile(ctx: ActionCtx, accountId: string) {
  try {
    const response = await fetchDiscordUserApi(ctx, accountId, '/users/@me');
    if (!response.ok) return undefined;
    const data: {
      id?: unknown;
      username?: unknown;
      global_name?: unknown;
      avatar?: unknown;
      discriminator?: unknown;
    } = await response.json();
    if (data.id !== accountId || typeof data.username !== 'string')
      return undefined;
    const username = data.username;
    const displayName =
      typeof data.global_name === 'string' && data.global_name.trim()
        ? data.global_name
        : username;
    let avatarUrl: string | undefined;
    if (/^\d{1,20}$/.test(accountId)) {
      if (
        typeof data.avatar === 'string' &&
        /^(a_)?[a-f0-9]{32}$/.test(data.avatar)
      ) {
        avatarUrl = `https://cdn.discordapp.com/avatars/${accountId}/${data.avatar}.png?size=128`;
      } else if (data.avatar === null || data.avatar === undefined) {
        const legacy =
          typeof data.discriminator === 'string' &&
          /^\d{4}$/.test(data.discriminator) &&
          data.discriminator !== '0000';
        const index = legacy
          ? Number(data.discriminator) % 5
          : Number((BigInt(accountId) >> 22n) % 6n);
        avatarUrl = `https://cdn.discordapp.com/embed/avatars/${index}.png`;
      }
    }
    return { username, displayName, avatarUrl };
  } catch {
    return undefined;
  }
}

type LinkedAccount = Infer<typeof linkedAccountValidator>;
type EnrichedAccount = Infer<typeof enrichedAccountValidator>;

/**
 * Get linked accounts with current Discord display fields. Credentials stay server-side.
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
        const profile =
          account.providerId === 'discord'
            ? await fetchDiscordProfile(ctx, account.accountId)
            : undefined;
        const username =
          account.providerId === 'google'
            ? data.user?.email
            : profile?.username;

        return {
          id: account.id,
          providerId: account.providerId,
          accountId: account.accountId,
          username,
          displayName: profile?.displayName,
          avatarUrl: profile?.avatarUrl,
          createdAt: account.createdAt,
        };
      })
    );

    return enrichedAccounts;
  },
});

/** Retirement remains visible after unlink, even when no provider account remains. */
export const getDiscordRetirementStatus = query({
  args: {},
  returns: v.object({
    pending: v.boolean(),
    error: v.optional(v.string()),
    externallyManaged: v.boolean(),
    selectedDiscordUserId: v.optional(v.string()),
  }),
  handler: async ctx => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return { pending: false, externallyManaged: false };
    const person = await ctx.db
      .query('persons')
      .withIndex('by_user_id', q => q.eq('userId', String(user._id)))
      .unique();
    if (!person) return { pending: false, externallyManaged: false };
    let error: string | undefined;
    let pending = false;
    for (const status of ['pending', 'blocked'] as const) {
      const row = await ctx.db
        .query('groupDiscordCleanup')
        .withIndex('by_person_status', q =>
          q.eq('personId', String(person._id)).eq('status', status)
        )
        .first();
      if (row) {
        pending = true;
        error ??= row.error;
      }
    }
    const exception = await ctx.db
      .query('groupDiscordEnrollments')
      .withIndex('by_person_removed_exception', q =>
        q
          .eq('personId', person._id)
          .eq('mode', 'membership')
          .eq('desired', 'removed')
          .gt('externalException', undefined)
      )
      .first();
    const selected = await ctx.db
      .query('groupDiscordManagedIdentities')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .unique();
    return {
      pending,
      error,
      externallyManaged: !!exception,
      selectedDiscordUserId: selected?.discordUserId,
    };
  },
});
