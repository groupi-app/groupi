import { query } from '../_generated/server';
import { v } from 'convex/values';
import { getCurrentPerson } from '../auth';
import { action, actions, grantSummary, auditFields } from './contracts';
import { denied } from './model';
export const list = query({
  args: {},
  returns: v.array(grantSummary),
  handler: async ctx => {
    const person = await getCurrentPerson(ctx);
    if (!person) return [];
    const grants = await ctx.db
      .query('authorizationGrants')
      .withIndex('by_grantorPersonId', q => q.eq('grantorPersonId', person._id))
      .collect();
    const result = [];
    for (const grant of grants) {
      if (grant.appId !== undefined) continue;
      const principal = await ctx.db.get(grant.principalId);
      if (!principal) continue;
      result.push({
        grantId: grant._id,
        appId: grant.appId ?? null,
        principalId: principal._id,
        principalKind: principal.kind,
        name: grant.name,
        actions: grant.actions,
        selector: grant.selector,
        expiresAt: grant.expiresAt ?? null,
        revokedAt: grant.revokedAt ?? null,
        background: grant.background,
        createdAt: grant.createdAt,
        updatedAt: grant.updatedAt,
      });
    }
    return result;
  },
});
export const eligibleEvents = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('events'),
      title: v.string(),
      role: v.union(
        v.literal('ORGANIZER'),
        v.literal('MODERATOR'),
        v.literal('ATTENDEE')
      ),
    })
  ),
  handler: async ctx => {
    const person = await getCurrentPerson(ctx);
    if (!person) return [];
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .collect();
    const result = [];
    for (const member of memberships) {
      const event = await ctx.db.get(member.eventId);
      if (event)
        result.push({ _id: event._id, title: event.title, role: member.role });
    }
    return result;
  },
});
export const catalog = query({
  args: {},
  returns: v.array(
    v.object({
      action,
      supported: v.boolean(),
      principalKinds: v.array(
        v.union(v.literal('user'), v.literal('integration'))
      ),
    })
  ),
  handler: async ctx => {
    if (!(await getCurrentPerson(ctx))) return [];
    return actions
      .filter(action => action !== 'groups.context.read')
      .map(action => ({
        action,
        supported: true,
        principalKinds: action.startsWith('identity.')
          ? ['user' as const]
          : ['user' as const, 'integration' as const],
      }));
  },
});
export const audit = query({
  args: { grantId: v.id('authorizationGrants') },
  returns: v.array(
    v.object({
      _id: v.id('authorizationAudit'),
      _creationTime: v.number(),
      ...auditFields,
    })
  ),
  handler: async (ctx, { grantId }) => {
    const person = await getCurrentPerson(ctx);
    const grant = await ctx.db.get(grantId);
    if (!person || !grant || grant.grantorPersonId !== person._id)
      throw denied();
    return ctx.db
      .query('authorizationAudit')
      .withIndex('by_grantId', q => q.eq('grantId', grantId))
      .order('desc')
      .take(100);
  },
});
