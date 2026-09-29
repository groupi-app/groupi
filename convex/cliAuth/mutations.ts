import { ConvexError, v } from 'convex/values';
import { internalMutation, mutation } from '../_generated/server';
import { components, internal } from '../_generated/api';
import { authComponent, requireAuth } from '../auth';

const TOKEN = /^[A-Za-z0-9_-]{43}$/;
const GRANT_LIFETIME = 5 * 60_000;
const KEY_LIFETIME = 90 * 86_400_000;

function base64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
async function hash(value: string) {
  return base64url(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
    )
  );
}
function randomToken() {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}
function validPort(port: number) {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

export const authorize = mutation({
  args: { state: v.string(), challenge: v.string(), callbackPort: v.number() },
  returns: v.object({ code: v.string(), expiresAt: v.number() }),
  handler: async (ctx, args) => {
    const { user, person } = await requireAuth(ctx);
    if (
      !TOKEN.test(args.state) ||
      !TOKEN.test(args.challenge) ||
      !validPort(args.callbackPort)
    ) {
      throw new ConvexError(
        'Invalid CLI authorization request. Start login again from the CLI.'
      );
    }
    const account = await authComponent.getAnyUserById(ctx, user._id);
    if (
      !account ||
      (account.banned &&
        (account.banExpires == null || account.banExpires > Date.now()))
    ) {
      throw new ConvexError('Account cannot authorize CLI access.');
    }
    // A repeated click cannot mint several outstanding codes for one attempt.
    const previous = await ctx.db
      .query('cliAuthGrants')
      .withIndex('by_userId_and_state', q =>
        q.eq('userId', user._id).eq('state', args.state)
      )
      .first();
    if (previous) await ctx.db.delete(previous._id);
    const code = randomToken();
    const expiresAt = Date.now() + GRANT_LIFETIME;
    const grantId = await ctx.db.insert('cliAuthGrants', {
      ...args,
      userId: user._id,
      personId: person._id,
      codeHash: await hash(code),
      expiresAt,
    });
    await ctx.scheduler.runAfter(
      GRANT_LIFETIME,
      internal.cliAuth.mutations.expire,
      { grantId }
    );
    return { code, expiresAt };
  },
});

export const expire = internalMutation({
  args: { grantId: v.id('cliAuthGrants') },
  returns: v.null(),
  handler: async (ctx, { grantId }) => {
    if (await ctx.db.get(grantId)) await ctx.db.delete(grantId);
    return null;
  },
});

export const exchange = internalMutation({
  args: {
    code: v.string(),
    verifier: v.string(),
    state: v.string(),
    callbackPort: v.number(),
  },
  returns: v.union(
    v.null(),
    v.object({
      apiKey: v.string(),
      expiresAt: v.number(),
      account: v.object({
        id: v.string(),
        name: v.string(),
        email: v.string(),
      }),
    })
  ),
  handler: async (ctx, args) => {
    if (
      !TOKEN.test(args.code) ||
      !TOKEN.test(args.verifier) ||
      !TOKEN.test(args.state) ||
      !validPort(args.callbackPort)
    )
      return null;
    const codeHash = await hash(args.code);
    const grant = await ctx.db
      .query('cliAuthGrants')
      .withIndex('by_codeHash', q => q.eq('codeHash', codeHash))
      .first();
    const now = Date.now();
    if (
      !grant ||
      grant.expiresAt <= now ||
      grant.state !== args.state ||
      grant.callbackPort !== args.callbackPort ||
      grant.challenge !== (await hash(args.verifier))
    )
      return null;
    const user = await authComponent.getAnyUserById(ctx, grant.userId);
    const person = await ctx.db.get(grant.personId);
    if (
      !user ||
      !person ||
      person.userId !== grant.userId ||
      (user.banned && (user.banExpires == null || user.banExpires > now))
    )
      return null;
    const apiKey = `grp_${randomToken()}`;
    const expiresAt = now + KEY_LIFETIME;
    // Component writes participate in this same Convex transaction. A failed
    // insert cannot consume the grant; concurrent exchanges cannot issue twice.
    await ctx.runMutation(components.betterAuth.adapter.create, {
      input: {
        model: 'apikey',
        data: {
          configId: 'default',
          userId: user._id,
          name: 'Groupi CLI',
          key: await hash(apiKey),
          start: apiKey.slice(0, 10),
          prefix: 'grp_',
          enabled: true,
          expiresAt,
          createdAt: now,
          updatedAt: now,
          rateLimitEnabled: true,
          rateLimitMax: 120,
          rateLimitTimeWindow: 60_000,
          requestCount: 0,
        },
      },
    });
    await ctx.db.delete(grant._id);
    return {
      apiKey,
      expiresAt,
      account: { id: user._id, name: user.name, email: user.email },
    };
  },
});

export const revoke = internalMutation({
  args: { apiKey: v.string(), userId: v.string() },
  returns: v.null(),
  handler: async (ctx, { apiKey, userId }) => {
    const record = await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: 'apikey',
      where: [{ field: 'key', value: await hash(apiKey) }],
    });
    if (record && record.userId === userId)
      await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
        input: {
          model: 'apikey',
          where: [{ field: '_id', value: record._id }],
        },
      });
    return null;
  },
});
