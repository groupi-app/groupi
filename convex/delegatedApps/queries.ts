import { v } from 'convex/values';
import { query } from '../_generated/server';
import { getCurrentPerson } from '../auth';
import { app } from './contracts';
export const listOwnedApps = query({
  args: {},
  returns: v.array(app),
  handler: async ctx => {
    const person = await getCurrentPerson(ctx);
    if (!person) return [];
    return ctx.db
      .query('delegatedApps')
      .withIndex('by_ownerPersonId', q => q.eq('ownerPersonId', person._id))
      .take(100);
  },
});

import { action, selector, actions } from '../authorization/contracts';
import { getCurrentUserAndPerson } from '../auth';
export const getConsentRequest = query({
  args: { interactionId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      interactionId: v.string(),
      instance: v.string(),
      appId: v.id('delegatedApps'),
      appName: v.string(),
      purpose: v.string(),
      requestedScopes: v.array(v.string()),
      requestedActions: v.array(action),
      account: v.object({ displayName: v.string() }),
      events: v.array(v.object({ _id: v.id('events'), title: v.string() })),
      expiresAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const auth = await getCurrentUserAndPerson(ctx);
    if (!auth) return null;
    const request = await ctx.db
      .query('delegatedConsentRequests')
      .withIndex('by_interactionId', q =>
        q.eq('interactionId', args.interactionId)
      )
      .unique();
    if (!request || request.decision) return null;
    const app = await ctx.db.get(request.appId);
    if (
      !app ||
      app.status === 'suspended' ||
      (app.status === 'testing' && app.ownerPersonId !== auth.person._id)
    )
      return null;
    const members = await ctx.db
      .query('memberships')
      .withIndex('by_person', q => q.eq('personId', auth.person._id))
      .take(100);
    const events = [];
    for (const member of members) {
      const event = await ctx.db.get(member.eventId);
      if (event) events.push({ _id: event._id, title: event.title });
    }
    return {
      interactionId: request.interactionId,
      instance: request.instanceId,
      appId: app._id,
      appName: app.name,
      purpose: app.purpose,
      requestedScopes: request.requestedScopes,
      requestedActions: actions.filter(value =>
        request.requestedScopes.includes(value)
      ),
      account: { displayName: auth.user.name ?? 'Current account' },
      events,
      expiresAt: request.expiresAt,
    };
  },
});
export const listConnections = query({
  args: {},
  returns: v.array(
    v.object({
      grantId: v.id('authorizationGrants'),
      appName: v.string(),
      actions: v.array(action),
      selector,
      background: v.boolean(),
      createdAt: v.number(),
      expiresAt: v.union(v.number(), v.null()),
      status: v.union(
        v.literal('active'),
        v.literal('revoked'),
        v.literal('suspended')
      ),
    })
  ),
  handler: async ctx => {
    const person = await getCurrentPerson(ctx);
    if (!person) return [];
    const bindings = await ctx.db
      .query('delegatedGrantBindings')
      .withIndex('by_personId', q => q.eq('personId', person._id))
      .take(100);
    const results = [];
    for (const binding of bindings) {
      const grant = await ctx.db.get(binding.grantId);
      const app = await ctx.db.get(binding.appId);
      if (!grant || grant.grantorPersonId !== person._id || !app) continue;
      results.push({
        grantId: grant._id,
        appName: app.name,
        actions: grant.actions,
        selector: grant.selector,
        background: grant.background,
        createdAt: grant.createdAt,
        expiresAt: grant.expiresAt ?? null,
        status:
          grant.revokedAt !== undefined
            ? ('revoked' as const)
            : app.status === 'suspended'
              ? ('suspended' as const)
              : ('active' as const),
      });
    }
    return results;
  },
});
