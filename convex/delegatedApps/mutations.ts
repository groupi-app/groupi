import { ConvexError, v } from 'convex/values';
import { mutation, type MutationCtx } from '../_generated/server';
import { requireAuth } from '../auth';
import { isAdminRole } from '../lib/constants';
import { publicJwksSchema } from './payloads';
import { clientType } from './contracts';

export const registerApp = mutation({
  args: {
    name: v.string(),
    purpose: v.string(),
    clientType,
    redirectUris: v.array(v.string()),
    publicJwks: v.optional(v.string()),
  },
  returns: v.id('delegatedApps'),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    const name = args.name.trim();
    const purpose = args.purpose.trim();
    if (!name || name.length > 100 || !purpose || purpose.length > 1000)
      throw new ConvexError('App name and purpose are required');
    if (args.redirectUris.length < 1 || args.redirectUris.length > 10)
      throw new ConvexError('Register between one and ten callbacks');
    for (const callback of args.redirectUris) {
      let url: URL;
      try {
        url = new URL(callback);
      } catch {
        throw new ConvexError('Invalid callback URL');
      }
      const loopback =
        args.clientType === 'native' &&
        url.protocol === 'http:' &&
        (url.hostname === '127.0.0.1' || url.hostname === '[::1]');
      const privateUse =
        args.clientType === 'native' &&
        /^[a-z][a-z0-9]*(?:\.[a-z0-9][a-z0-9-]*){2,}:$/.test(url.protocol) &&
        !url.hostname &&
        url.pathname.startsWith('/') &&
        url.pathname !== '/' &&
        !callback.slice(url.protocol.length).startsWith('//');
      if (
        (url.protocol !== 'https:' && !loopback && !privateUse) ||
        url.username ||
        url.password ||
        url.hash ||
        callback.includes('*') ||
        callback.length > 2048
      )
        throw new ConvexError('Invalid callback URL');
    }
    if (args.clientType === 'confidential') {
      try {
        publicJwksSchema.parse(JSON.parse(args.publicJwks ?? ''));
      } catch {
        throw new ConvexError(
          'Confidential apps require distinct RS256 or ES256 public JWKS'
        );
      }
    } else if (args.publicJwks)
      throw new ConvexError(
        'Native apps do not register client secrets or keys'
      );
    const owned = await ctx.db
      .query('delegatedApps')
      .withIndex('by_ownerPersonId', q => q.eq('ownerPersonId', person._id))
      .take(100);
    if (owned.length >= 100)
      throw new ConvexError('App registration limit reached');
    const now = Date.now();
    return ctx.db.insert('delegatedApps', {
      ...args,
      name,
      purpose,
      redirectUris: [...new Set(args.redirectUris)],
      ownerPersonId: person._id,
      status: 'testing',
      reviewStatus: 'not-requested',
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const requestReview = mutation({
  args: { appId: v.id('delegatedApps') },
  returns: v.null(),
  handler: async (ctx, { appId }) => {
    const { person } = await requireAuth(ctx);
    const app = await ctx.db.get(appId);
    if (!app || app.ownerPersonId !== person._id)
      throw new ConvexError('App not found');
    if (app.status === 'suspended')
      throw new ConvexError('Suspended apps cannot request review');
    if (app.reviewStatus === 'pending' || app.status === 'approved')
      return null;
    await ctx.db.patch(appId, {
      reviewStatus: 'pending',
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const reviewApp = mutation({
  args: {
    appId: v.id('delegatedApps'),
    status: v.union(
      v.literal('approved'),
      v.literal('suspended'),
      v.literal('rejected')
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);
    if (!isAdminRole(user.role))
      throw new ConvexError('Platform administrator required');
    const app = await ctx.db.get(args.appId);
    if (!app) throw new ConvexError('App not found');
    const nextStatus = args.status === 'rejected' ? 'testing' : args.status;
    const nextReview = args.status === 'rejected' ? 'rejected' : 'reviewed';
    if (app.status === nextStatus && app.reviewStatus === nextReview)
      return null;
    await ctx.db.patch(app._id, {
      status: nextStatus,
      reviewStatus: nextReview,
      updatedAt: Date.now(),
    });
    return null;
  },
});

import { action, selector } from '../authorization/contracts';
import {
  randomSecret,
  secretHash,
  type AuthorizationAction,
  type EventSelector,
} from '../authorization/model';
import type { Doc, Id } from '../_generated/dataModel';
const resumeResult = v.object({ resumeUrl: v.string() });
export const approveConsent = mutation({
  args: {
    interactionId: v.string(),
    actions: v.array(action),
    selector,
    background: v.boolean(),
  },
  returns: resumeResult,
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    const request = await ctx.db
      .query('delegatedConsentRequests')
      .withIndex('by_interactionId', q =>
        q.eq('interactionId', args.interactionId)
      )
      .unique();
    if (!request || request.expiresAt <= Date.now())
      throw new ConvexError('Authorization request expired');
    if (request.decision)
      throw new ConvexError('Authorization request already completed');
    const app = await ctx.db.get(request.appId);
    if (
      !app ||
      app.status === 'suspended' ||
      (app.status === 'testing' && app.ownerPersonId !== person._id)
    )
      throw new ConvexError('App is not eligible for this account');
    if (
      args.actions.some(value => !request.requestedScopes.includes(value)) ||
      (args.background && !request.requestedScopes.includes('offline_access'))
    )
      throw new ConvexError('Consent cannot add requested permissions');
    if (
      !args.actions.some(value => !value.startsWith('identity.')) &&
      (args.selector.kind !== 'selected' || args.selector.eventIds.length)
    )
      throw new ConvexError(
        'Identity-only sign-in does not include event access'
      );
    return issueApproval(ctx, request, person._id, {
      decision: 'approved',
      actions: args.actions,
      selector: args.selector,
      background: args.background,
    });
  },
});
export const denyConsent = mutation({
  args: { interactionId: v.string() },
  returns: resumeResult,
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    const request = await ctx.db
      .query('delegatedConsentRequests')
      .withIndex('by_interactionId', q =>
        q.eq('interactionId', args.interactionId)
      )
      .unique();
    if (!request || request.expiresAt <= Date.now() || request.decision)
      throw new ConvexError('Authorization request expired or completed');
    return issueApproval(ctx, request, person._id, {
      decision: 'denied',
      actions: [],
      selector: { kind: 'selected', eventIds: [] },
      background: false,
    });
  },
});
export const disconnect = mutation({
  args: { grantId: v.id('authorizationGrants') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    const grant = await ctx.db.get(args.grantId);
    if (!grant || grant.grantorPersonId !== person._id || !grant.appId)
      throw new ConvexError('Connection not found');
    const binding = await ctx.db
      .query('delegatedGrantBindings')
      .withIndex('by_grantId', q => q.eq('grantId', grant._id))
      .unique();
    if (binding?.active) await ctx.db.patch(binding._id, { active: false });
    if (grant.revokedAt !== undefined) return null;
    await ctx.db.patch(grant._id, {
      revokedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});

async function issueApproval(
  ctx: MutationCtx,
  request: Doc<'delegatedConsentRequests'>,
  personId: Id<'persons'>,
  decision: {
    decision: 'approved' | 'denied';
    actions: AuthorizationAction[];
    selector: EventSelector;
    background: boolean;
  }
) {
  const ticket = randomSecret();
  const fields = {
    ticketHash: await secretHash(ticket),
    interactionId: request.interactionId,
    appId: request.appId,
    instanceId: request.instanceId,
    requestedScopes: request.requestedScopes,
    personId,
    ...decision,
    expiresAt: Math.min(request.expiresAt, Date.now() + 60000),
    consumedAt: undefined,
  };
  const existing = await ctx.db
    .query('delegatedConsentApprovals')
    .withIndex('by_interactionId_and_personId', q =>
      q.eq('interactionId', request.interactionId).eq('personId', personId)
    )
    .unique();
  if (existing) await ctx.db.patch(existing._id, fields);
  else await ctx.db.insert('delegatedConsentApprovals', fields);
  const resume = new URL(
    `${request.instanceId}/interaction/${encodeURIComponent(request.interactionId)}`
  );
  resume.searchParams.set('approval', ticket);
  return { resumeUrl: resume.href };
}
