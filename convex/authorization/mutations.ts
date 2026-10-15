import { internal } from '../_generated/api';
import { mutation, internalMutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { action, selector, principalKind } from './contracts';
import {
  accountActive,
  assertBounds,
  audit,
  denied,
  randomSecret,
  secretHash,
} from './model';
export const issue = mutation({
  args: {
    name: v.string(),
    principalKind,
    actions: v.array(action),
    selector,
    expiresAt: v.optional(v.number()),
  },
  returns: v.object({
    grantId: v.id('authorizationGrants'),
    principalId: v.id('authorizationPrincipals'),
    credentialId: v.id('authorizationCredentials'),
    key: v.string(),
  }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    const now = Date.now();
    await accountActive(ctx, person._id, now);
    const name = args.name.trim();
    if (!name || name.length > 100)
      throw denied('Name must contain 1 to 100 characters.');
    if (
      args.expiresAt !== undefined &&
      (!Number.isFinite(args.expiresAt) || args.expiresAt <= now)
    )
      throw denied('Expiry must be in the future.');
    await assertBounds(
      ctx,
      person._id,
      args.principalKind,
      args.selector,
      args.actions
    );
    const principalId = await ctx.db.insert('authorizationPrincipals', {
      kind: args.principalKind,
      ownerPersonId: person._id,
      name,
      createdAt: now,
    });
    const grantId = await ctx.db.insert('authorizationGrants', {
      principalId,
      grantorPersonId: person._id,
      name,
      actions: args.actions,
      selector: args.selector,
      expiresAt: args.expiresAt,
      background: false,
      createdAt: now,
      updatedAt: now,
    });
    const key = `grp_b_${randomSecret()}`;
    const credentialId = await ctx.db.insert('authorizationCredentials', {
      grantId,
      kind: 'named-key',
      secretHash: await secretHash(key),
      createdAt: now,
    });
    await audit(
      ctx,
      (await ctx.db.get(grantId))!,
      'issued',
      'allowed',
      'owner-issued',
      undefined,
      credentialId
    );
    return { grantId, principalId, credentialId, key };
  },
});
export const revoke = mutation({
  args: { grantId: v.id('authorizationGrants') },
  returns: v.object({ revokedAt: v.number() }),
  handler: async (ctx, { grantId }) => {
    const { person } = await requireAuth(ctx);
    const grant = await ctx.db.get(grantId);
    if (!grant || grant.grantorPersonId !== person._id) throw denied();
    if (grant.revokedAt !== undefined) return { revokedAt: grant.revokedAt };
    const revokedAt = Date.now();
    await ctx.db.patch(grantId, { revokedAt, updatedAt: revokedAt });
    await audit(ctx, grant, 'revoked', 'allowed', 'owner-revoked');
    return { revokedAt };
  },
});
export const replaceBounds = mutation({
  args: {
    grantId: v.id('authorizationGrants'),
    actions: v.array(action),
    selector,
  },
  returns: v.object({ updatedAt: v.number() }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    const grant = await ctx.db.get(args.grantId);
    if (
      !grant ||
      grant.grantorPersonId !== person._id ||
      grant.revokedAt !== undefined ||
      grant.appId !== undefined
    )
      throw denied();
    const principal = await ctx.db.get(grant.principalId);
    if (!principal) throw denied();
    await accountActive(ctx, person._id, Date.now());
    await assertBounds(
      ctx,
      person._id,
      principal.kind,
      args.selector,
      args.actions
    );
    const updatedAt = Date.now();
    await ctx.db.patch(grant._id, {
      actions: args.actions,
      selector: args.selector,
      updatedAt,
    });
    await audit(ctx, grant, 'bounds-updated', 'allowed', 'owner-updated');
    return { updatedAt };
  },
});
export const revokeUserCredentials = mutation({
  args: {},
  returns: v.object({ revokedCount: v.number() }),
  handler: async ctx => {
    const { person } = await requireAuth(ctx);
    const grants = await ctx.db
      .query('authorizationGrants')
      .withIndex('by_grantorPersonId', q => q.eq('grantorPersonId', person._id))
      .collect();
    let revokedCount = 0;
    const now = Date.now();
    for (const grant of grants) {
      const principal = await ctx.db.get(grant.principalId);
      if (principal?.kind !== 'user' || grant.revokedAt !== undefined) continue;
      await ctx.db.patch(grant._id, { revokedAt: now, updatedAt: now });
      await audit(ctx, grant, 'recovery-revoked', 'allowed', 'owner-recovery');
      revokedCount++;
    }
    return { revokedCount };
  },
});
export const pruneAudit = internalMutation({
  args: {},
  returns: v.null(),
  handler: async ctx => {
    const cutoff = Date.now() - 90 * 86400000;
    const rows = await ctx.db
      .query('authorizationAudit')
      .withIndex('by_createdAt', q => q.lt('createdAt', cutoff))
      .take(500);
    for (const row of rows) await ctx.db.delete(row._id);
    if (rows.length === 500)
      await ctx.scheduler.runAfter(
        0,
        internal.authorization.mutations.pruneAudit,
        {}
      );
    return null;
  },
});
