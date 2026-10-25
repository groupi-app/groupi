import { v } from 'convex/values';
import { internalQuery, type QueryCtx } from '../_generated/server';
import { components } from '../_generated/api';

async function getActiveAccount(ctx: QueryCtx) {
  const userId = process.env.APP_REVIEW_USER_ID;
  if (process.env.APP_REVIEW_INBOX_ENABLED !== 'true' || !userId) return null;
  const account = await ctx.db
    .query('appReviewAccounts')
    .withIndex('by_user_id', q => q.eq('userId', userId))
    .unique();
  if (
    !account ||
    account.revokedAt !== undefined ||
    account.expiresAt <= Date.now()
  ) {
    return null;
  }
  const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
    model: 'user',
    where: [{ field: '_id', operator: 'eq', value: userId }],
  });
  if (
    !user ||
    user.email !== account.email ||
    user.banned ||
    (user.role && user.role !== 'user')
  )
    return null;
  const person = await ctx.db.get(account.personId);
  return person?.userId === userId ? account : null;
}

/** Redirect only the registered demo account's sign-in delivery to its inbox. */
export const usesPrivateInbox = internalQuery({
  args: { email: v.string() },
  returns: v.boolean(),
  handler: async (ctx, { email }) => {
    if (!/^app-review-[a-f0-9]{16}@groupi\.gg$/.test(email.toLowerCase()))
      return false;
    const account = await getActiveAccount(ctx);
    return account?.email === email.toLowerCase();
  },
});

export const readInbox = internalQuery({
  args: { accessKey: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      email: v.string(),
      otp: v.union(v.string(), v.null()),
      expiresAt: v.union(v.number(), v.null()),
    })
  ),
  handler: async (ctx, { accessKey }) => {
    // A generated 256-bit key is the inbox credential; never accept short passwords.
    if (!/^[a-f0-9]{64}$/.test(accessKey)) return null;
    const account = await getActiveAccount(ctx);
    if (!account) return null;
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(accessKey)
    );
    const hash = Array.from(new Uint8Array(digest), byte =>
      byte.toString(16).padStart(2, '0')
    ).join('');
    let difference = hash.length ^ account.accessKeyHash.length;
    for (let i = 0; i < hash.length; i += 1) {
      difference |=
        hash.charCodeAt(i) ^ (account.accessKeyHash.charCodeAt(i) || 0);
    }
    if (difference !== 0) return null;

    // Match Better Auth's findVerificationValue: resends can leave multiple
    // records, and only the most recently created one is used for verification.
    const verifications = await ctx.runQuery(
      components.betterAuth.adapter.findMany,
      {
        model: 'verification',
        where: [
          {
            field: 'identifier',
            operator: 'eq',
            value: `sign-in-otp-${account.email}`,
          },
        ],
        sortBy: { field: 'createdAt', direction: 'desc' },
        paginationOpts: { cursor: null, numItems: 1 },
      }
    );
    const verification = verifications.page[0];
    // Better Auth 1.6 stores normal plain OTPs as code:attempts. Fail closed if
    // its storage format changes. Do not surface reset/verification/magic tokens.
    const match = verification?.value.match(/^(\d{6}):(\d+)$/);
    const available =
      verification &&
      verification.expiresAt > Date.now() &&
      match &&
      Number(match[2]) < 3;
    return {
      email: account.email,
      otp: available ? match[1] : null,
      expiresAt: available ? verification.expiresAt : null,
    };
  },
});
