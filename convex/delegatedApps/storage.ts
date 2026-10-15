import { v } from 'convex/values';
import { artifactModel, scope } from './contracts';
import {
  validatePayload,
  accessTokenPayloadSchema,
  parseScopeString,
} from './payloads';
import {
  internalMutation,
  internalQuery,
  type QueryCtx,
  type MutationCtx,
} from '../_generated/server';
import { liveGrant, assertBounds } from '../authorization/model';

async function binding(
  ctx: QueryCtx | MutationCtx,
  grantKey: string,
  now: number
) {
  const revoked = await ctx.db
    .query('delegatedRevocations')
    .withIndex('by_grantKey', q => q.eq('grantKey', grantKey))
    .unique();
  if (revoked) return null;
  const bound = await ctx.db
    .query('delegatedGrantBindings')
    .withIndex('by_grantKey', q => q.eq('grantKey', grantKey))
    .unique();
  if (!bound) return null;
  try {
    const { grant, principal } = await liveGrant(ctx, bound.grantId, now);
    const identityOnly =
      principal.kind === 'user' &&
      grant.actions.length === 0 &&
      grant.selector.kind === 'selected' &&
      grant.selector.eventIds.length === 0;
    if (!identityOnly)
      await assertBounds(
        ctx,
        grant.grantorPersonId,
        principal.kind,
        grant.selector,
        grant.actions
      );
    return bound;
  } catch {
    return null;
  }
}
async function revoke(ctx: MutationCtx, grantKey: string) {
  const existing = await ctx.db
    .query('delegatedRevocations')
    .withIndex('by_grantKey', q => q.eq('grantKey', grantKey))
    .unique();
  if (!existing)
    await ctx.db.insert('delegatedRevocations', {
      grantKey,
      revokedAt: Date.now(),
    });
  const bound = await ctx.db
    .query('delegatedGrantBindings')
    .withIndex('by_grantKey', q => q.eq('grantKey', grantKey))
    .unique();
  if (bound) {
    if (bound.active) await ctx.db.patch(bound._id, { active: false });
    const grant = await ctx.db.get(bound.grantId);
    if (grant && !grant.revokedAt)
      await ctx.db.patch(grant._id, {
        revokedAt: Date.now(),
        updatedAt: Date.now(),
      });
  }
}
export const find = internalQuery({
  args: { model: artifactModel, keyHash: v.string(), now: v.number() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('delegatedArtifacts')
      .withIndex('by_model_and_key', q =>
        q.eq('model', args.model).eq('key', args.keyHash)
      )
      .unique();
    if (
      !row ||
      row.expiresAt <= args.now ||
      (row.grantKey && !(await binding(ctx, row.grantKey, args.now)))
    )
      return null;
    const payload = validatePayload(args.model, row.payload);
    if (row.consumedAt)
      return JSON.stringify({
        ...payload,
        consumed: Math.floor(row.consumedAt / 1000),
      });
    return JSON.stringify(payload);
  },
});
export const upsert = internalMutation({
  args: {
    model: artifactModel,
    keyHash: v.string(),
    payload: v.string(),
    grantKey: v.optional(v.string()),
    expiresAt: v.number(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    validatePayload(args.model, args.payload);
    const bound = args.grantKey
      ? await binding(ctx, args.grantKey, Date.now())
      : null;
    if (args.grantKey && !bound) return false;
    const row = await ctx.db
      .query('delegatedArtifacts')
      .withIndex('by_model_and_key', q =>
        q.eq('model', args.model).eq('key', args.keyHash)
      )
      .unique();
    if (args.model === 'ReplayDetection' && row) return false;
    const fields = {
      model: args.model,
      key: args.keyHash,
      payload: args.payload,
      grantKey: args.grantKey,
      expiresAt: args.expiresAt,
    };
    if (row) await ctx.db.patch(row._id, fields);
    else await ctx.db.insert('delegatedArtifacts', fields);
    if (args.model === 'AccessToken' && bound) {
      const token = accessTokenPayloadSchema.parse(JSON.parse(args.payload));
      const audience = `${new URL(bound.instanceId).origin}/api/v2`;
      const tokenScopes = parseScopeString(token.scope);
      const snapshotActions = actions.filter(action =>
        tokenScopes.includes(action)
      );
      const grant = await ctx.db.get(bound.grantId);
      if (
        !grant ||
        token.aud !== audience ||
        snapshotActions.length !== tokenScopes.length ||
        snapshotActions.some(action => !grant.actions.includes(action))
      )
        throw new ConvexError('Invalid delegated access bounds');

      const credential = await ctx.db
        .query('authorizationCredentials')
        .withIndex('by_secretHash', q => q.eq('secretHash', args.keyHash))
        .unique();
      if (!credential)
        await ctx.db.insert('authorizationCredentials', {
          grantId: bound.grantId,
          secretHash: args.keyHash,
          kind: 'delegated-access',
          actions: snapshotActions,
          audience,
          expiresAt: args.expiresAt,
          createdAt: Date.now(),
        });
    }
    return true;
  },
});
export const consume = internalMutation({
  args: { model: artifactModel, keyHash: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('delegatedArtifacts')
      .withIndex('by_model_and_key', q =>
        q.eq('model', args.model).eq('key', args.keyHash)
      )
      .unique();
    if (
      !row ||
      row.expiresAt <= Date.now() ||
      (row.grantKey && !(await binding(ctx, row.grantKey, Date.now())))
    )
      return false;
    if (row.consumedAt) {
      if (row.grantKey) await revoke(ctx, row.grantKey);
      return false;
    }
    await ctx.db.patch(row._id, { consumedAt: Date.now() });
    return true;
  },
});
export const destroy = internalMutation({
  args: {
    model: artifactModel,
    keyHash: v.string(),
    grantKey: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.model === 'Grant' && args.grantKey)
      await revoke(ctx, args.grantKey);
    const row = await ctx.db
      .query('delegatedArtifacts')
      .withIndex('by_model_and_key', q =>
        q.eq('model', args.model).eq('key', args.keyHash)
      )
      .unique();
    if (args.model === 'AccessToken') {
      const credential = await ctx.db
        .query('authorizationCredentials')
        .withIndex('by_secretHash', q => q.eq('secretHash', args.keyHash))
        .unique();
      if (credential && credential.revokedAt === undefined)
        await ctx.db.patch(credential._id, { revokedAt: Date.now() });
    }
    if (args.model === 'RefreshToken' && row?.grantKey)
      await revoke(ctx, row.grantKey);
    if (row) await ctx.db.delete(row._id);
    return null;
  },
});
export const revokeGrant = internalMutation({
  args: { grantKey: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await revoke(ctx, args.grantKey);
    return null;
  },
});

import { accountActive } from '../authorization/model';
import { actions } from '../authorization/contracts';
import { authComponent, type AuthUserId } from '../auth';
export const client = internalQuery({
  args: { appId: v.id('delegatedApps') },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const app = await ctx.db.get(args.appId);
    return !app || app.status === 'suspended' ? null : JSON.stringify(app);
  },
});
export const prepareConsent = internalMutation({
  args: {
    selectedGroupId: v.optional(v.id('groups')),
    interactionId: v.string(),
    appId: v.id('delegatedApps'),
    instanceId: v.string(),
    requestedScopes: v.array(scope),
    expiresAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const app = await ctx.db.get(args.appId);
    if (!app || app.status === 'suspended') throw new Error('App unavailable');
    if (
      !args.requestedScopes.includes('openid') ||
      args.requestedScopes.some(
        scope =>
          scope !== 'openid' &&
          scope !== 'offline_access' &&
          !actions.some(action => action === scope)
      )
    )
      throw new Error('Unsupported scopes');
    const request = await ctx.db
      .query('delegatedConsentRequests')
      .withIndex('by_interactionId', q =>
        q.eq('interactionId', args.interactionId)
      )
      .unique();
    if (
      args.requestedScopes.some(s => s.startsWith('groups.')) &&
      !args.selectedGroupId
    )
      throw new Error('Select a Group for own community access');
    if (
      args.selectedGroupId &&
      args.requestedScopes.some(
        s =>
          s !== 'openid' &&
          s !== 'offline_access' &&
          ![
            'groups.context.read',
            'groups.applications.submit',
            'groups.applications.edit',
            'groups.applications.withdraw',
          ].includes(s) &&
          !s.startsWith('identity.')
      )
    )
      throw new Error('Unsupported selected Group action');
    if (!request) await ctx.db.insert('delegatedConsentRequests', args);
    return null;
  },
});
export const consentDecision = internalQuery({
  args: { interactionId: v.string(), now: v.number() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const request = await ctx.db
      .query('delegatedConsentRequests')
      .withIndex('by_interactionId', q =>
        q.eq('interactionId', args.interactionId)
      )
      .unique();
    if (!request || request.expiresAt <= args.now) return null;
    if (
      request.decision === 'approved' &&
      (!request.grantKey || !(await binding(ctx, request.grantKey, args.now)))
    )
      return null;
    const grant = request.grantId ? await ctx.db.get(request.grantId) : null;
    return JSON.stringify({ request, grant });
  },
});
export const subject = internalMutation({
  args: {
    appId: v.id('delegatedApps'),
    personId: v.id('persons'),
    instanceId: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    await accountActive(ctx, args.personId, Date.now());
    const app = await ctx.db.get(args.appId);
    if (
      !app ||
      app.status === 'suspended' ||
      (app.status === 'testing' && app.ownerPersonId !== args.personId)
    )
      throw new Error('App unavailable');
    const existing = await ctx.db
      .query('delegatedSubjects')
      .withIndex('by_appId_and_personId_and_instanceId', q =>
        q
          .eq('appId', args.appId)
          .eq('personId', args.personId)
          .eq('instanceId', args.instanceId)
      )
      .unique();
    if (existing) return existing.subject;
    const subject = crypto.randomUUID();
    await ctx.db.insert('delegatedSubjects', { ...args, subject });
    return subject;
  },
});
export const account = internalQuery({
  args: { personId: v.id('persons'), now: v.number() },
  returns: v.union(v.null(), v.object({ name: v.string(), email: v.string() })),
  handler: async (ctx, args) => {
    try {
      await accountActive(ctx, args.personId, args.now);
    } catch {
      return null;
    }
    const person = await ctx.db.get(args.personId);
    if (!person) return null;
    const user = await authComponent.getAnyUserById(
      ctx,
      person.userId as AuthUserId
    );
    return user ? { name: user.name ?? '', email: user.email } : null;
  },
});

import { ConvexError } from 'convex/values';
import { createUserGrant } from '../authorization/model';
/** Called only after the provider verifies its signed browser interaction cookie. */
export const finalizeConsent = internalMutation({
  args: {
    interactionId: v.string(),
    ticketHash: v.string(),
    instanceId: v.string(),
    appId: v.id('delegatedApps'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query('delegatedConsentApprovals')
      .withIndex('by_ticketHash', q => q.eq('ticketHash', args.ticketHash))
      .unique();
    const request = await ctx.db
      .query('delegatedConsentRequests')
      .withIndex('by_interactionId', q =>
        q.eq('interactionId', args.interactionId)
      )
      .unique();
    if (
      !ticket ||
      !request ||
      ticket.consumedAt !== undefined ||
      ticket.expiresAt <= Date.now() ||
      request.expiresAt <= Date.now() ||
      request.decision ||
      ticket.interactionId !== request.interactionId ||
      ticket.appId !== request.appId ||
      ticket.instanceId !== request.instanceId ||
      request.instanceId !== args.instanceId ||
      request.appId !== args.appId ||
      JSON.stringify(ticket.requestedScopes) !==
        JSON.stringify(request.requestedScopes)
    )
      throw new ConvexError('Authorization approval expired or invalid');
    await accountActive(ctx, ticket.personId, Date.now());
    const app = await ctx.db.get(request.appId);
    if (
      !app ||
      app.status === 'suspended' ||
      (app.status === 'testing' && app.ownerPersonId !== ticket.personId)
    )
      throw new ConvexError('App not eligible');
    if (
      ticket.actions.some(
        action => !request.requestedScopes.includes(action)
      ) ||
      (ticket.background && !request.requestedScopes.includes('offline_access'))
    )
      throw new ConvexError('Approval scope changed');
    if (
      ticket.selector.kind === 'selected-group' &&
      ticket.selector.groupId !== request.selectedGroupId
    )
      throw new ConvexError('Selected Group changed');
    if (
      request.selectedGroupId &&
      ticket.selector.kind !== 'selected-group' &&
      ticket.actions.some(a => !a.startsWith('identity.'))
    )
      throw new ConvexError(
        'Selected Group consent cannot grant unrelated Events'
      );
    if (ticket.decision === 'denied') {
      await ctx.db.patch(request._id, {
        decision: 'denied',
        personId: ticket.personId,
      });
    } else {
      const connections = await ctx.db
        .query('delegatedGrantBindings')
        .withIndex('by_personId_and_active', q =>
          q.eq('personId', ticket.personId).eq('active', true)
        )
        .take(101);
      let activeConnections = 0;
      for (const connection of connections) {
        const existing = await ctx.db.get(connection.grantId);
        if (
          !existing ||
          existing.revokedAt !== undefined ||
          (existing.expiresAt !== undefined && existing.expiresAt <= Date.now())
        )
          await ctx.db.patch(connection._id, { active: false });
        else activeConnections++;
      }
      if (activeConnections >= 100)
        throw new ConvexError('Disconnect an app before connecting another');
      const grantId = await createUserGrant(ctx, {
        personId: ticket.personId,
        name: app.name,
        actions: ticket.actions,
        selector: ticket.selector,
        background: ticket.background,
        appId: app._id,
        instanceId: request.instanceId,
        expiresAt: Date.now() + 30 * 86400000,
      });
      const grantKey = request.interactionId;
      await ctx.db.insert('delegatedGrantBindings', {
        active: true,
        grantKey,
        grantId,
        appId: app._id,
        personId: ticket.personId,
        instanceId: request.instanceId,
      });
      await ctx.db.patch(request._id, {
        decision: 'approved',
        personId: ticket.personId,
        grantId,
        grantKey,
      });
    }
    await ctx.db.patch(ticket._id, { consumedAt: Date.now() });
    return null;
  },
});

import { internal } from '../_generated/api';
/** Expired provider state is inert already; retain revocation tombstones permanently. */
export const pruneExpired = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx): Promise<null> => {
    const now = Date.now();
    const [artifacts, approvals, requests] = await Promise.all([
      ctx.db
        .query('delegatedArtifacts')
        .withIndex('by_expiresAt', q => q.lt('expiresAt', now))
        .take(100),
      ctx.db
        .query('delegatedConsentApprovals')
        .withIndex('by_expiresAt', q => q.lt('expiresAt', now))
        .take(100),
      ctx.db
        .query('delegatedConsentRequests')
        .withIndex('by_expiresAt', q => q.lt('expiresAt', now))
        .take(100),
    ]);
    for (const record of [...artifacts, ...approvals, ...requests])
      await ctx.db.delete(record._id);
    if ([artifacts, approvals, requests].some(rows => rows.length === 100))
      await ctx.scheduler.runAfter(
        0,
        internal.delegatedApps.storage.pruneExpired,
        {}
      );
    return null;
  },
});
