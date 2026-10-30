import { participationRevision } from '../events/participationRevision';
import { rsvpChoices, rsvpStatus } from '../availability/contracts';
import { isEventCurrentCandidate } from '../events/lifecycle';
import { v } from 'convex/values';
import { query } from '../_generated/server';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { requireAuth, getPersonWithUser } from '../auth';
import { canAccessGroupMemberContent } from './contentAccess';
import { canViewAttendance } from '../events/attendance';
import { eventAdmissionAccess } from '../events/admission';
import { denied } from '../authorization/model';

export const currentEventResult = v.union(
  v.object({ kind: v.literal('none') }),
  v.object({
    kind: v.literal('conflict'),
    code: v.literal('STAFF_CONFIGURATION_CONFLICT'),
  }),
  v.object({
    kind: v.literal('event'),
    supportedRsvpChoices: v.array(rsvpStatus),
    allowedRsvpTransitions: v.array(rsvpStatus),
    event: v.object({
      id: v.id('events'),
      title: v.string(),
      description: v.union(v.string(), v.null()),
      location: v.union(v.string(), v.null()),
      timezone: v.string(),
      startsAt: v.union(v.number(), v.null()),
      endsAt: v.union(v.number(), v.null()),
      ongoing: v.boolean(),
      roster: v.union(v.array(v.object({ displayName: v.string() })), v.null()),
    }),
    participation: v.union(
      v.null(),
      v.object({
        membershipId: v.id('memberships'),
        revision: v.number(),
        rsvp: v.union(
          v.literal('PENDING'),
          v.literal('YES'),
          v.literal('NO'),
          v.literal('MAYBE')
        ),
      })
    ),
    allowedActions: v.array(v.string()),
  })
);
/** Selected Group eligibility is deliberately narrower than Public/Friends discovery. */
export async function currentEventForPerson(
  ctx: QueryCtx | MutationCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>,
  grantedActions: string[] = [
    'groups.events.read',
    'groups.events.join',
    'groups.events.rsvp',
    'groups.events.leave',
  ],
  now = Date.now()
) {
  if (!(await ctx.db.get(groupId))) throw denied();
  const eligible = await canAccessGroupMemberContent(ctx, groupId, personId);
  const events = [];
  let retained = false;
  for await (const link of ctx.db
    .query('groupEventAudiences')
    .withIndex('by_groupId', q => q.eq('groupId', groupId))) {
    const event = await ctx.db.get(link.eventId);
    if (!event) continue;
    const access = await eventAdmissionAccess(ctx, event, personId);
    retained ||= Boolean(access.membership);
    if (!(await isEventCurrentCandidate(ctx, event, now))) continue;
    if (!access.membership && !(eligible && access.hasApplicationAudience))
      continue;
    events.push({ event, access });
  }
  if (!eligible && !retained) throw denied();
  if (!events.length) return { kind: 'none' as const };
  if (events.length > 1)
    return {
      kind: 'conflict' as const,
      code: 'STAFF_CONFIGURATION_CONFLICT' as const,
    };
  const { event, access } = events[0];
  let canLeave = Boolean(access.membership);
  if (access.membership?.role === 'ORGANIZER') {
    const organizers = await ctx.db
      .query('memberships')
      .withIndex('by_event_role', q =>
        q.eq('eventId', event._id).eq('role', 'ORGANIZER')
      )
      .collect();
    canLeave = organizers.length > 1;
  }
  let roster: { displayName: string }[] | null = null;
  if (access.membership && canViewAttendance(event, access.membership)) {
    roster = [];
    for await (const member of ctx.db
      .query('memberships')
      .withIndex('by_event', q => q.eq('eventId', event._id))) {
      const person = await getPersonWithUser(ctx, member.personId);
      roster.push({
        displayName: person?.user.name ?? person?.user.username ?? 'Member',
      });
    }
  }
  return {
    kind: 'event' as const,
    supportedRsvpChoices: [...rsvpChoices],
    allowedRsvpTransitions:
      access.membership && grantedActions.includes('groups.events.rsvp')
        ? [...rsvpChoices]
        : [],
    event: {
      id: event._id,
      title: event.title,
      description: event.description ?? null,
      location: event.location ?? null,
      timezone: event.timezone,
      startsAt: event.chosenDateTime ?? null,
      endsAt: event.chosenEndDateTime ?? null,
      ongoing:
        event.chosenDateTime !== undefined && event.chosenDateTime <= now,
      roster,
    },
    participation: access.membership
      ? {
          membershipId: access.membership._id,
          revision: participationRevision(access.membership),
          rsvp: access.membership.rsvpStatus,
        }
      : null,
    // Grant and current eligibility jointly describe implemented actions.
    allowedActions: grantedActions.filter(
      a =>
        a === 'groups.events.read' ||
        (a === 'groups.events.join' && eligible && access.canJoin) ||
        (a === 'groups.events.rsvp' && Boolean(access.membership)) ||
        (a === 'groups.events.leave' && canLeave)
    ),
  };
}
export const getCurrentEvent = query({
  args: { groupId: v.id('groups') },
  returns: currentEventResult,
  handler: async (ctx, args) =>
    currentEventForPerson(
      ctx,
      args.groupId,
      (await requireAuth(ctx)).person._id
    ),
});

import { internalQuery } from '../_generated/server';
import { authorizeCommunity } from './community';
export const readCurrentEvent = internalQuery({
  args: { credentialId: v.id('authorizationCredentials'), groupId: v.string() },
  returns: currentEventResult,
  handler: async (ctx, args) => {
    const { credential, grant, groupId, personId } = await authorizeCommunity(
      ctx,
      args,
      'groups.events.read'
    );
    return currentEventForPerson(
      ctx,
      groupId,
      personId,
      credential.actions.filter(a => grant.actions.includes(a))
    );
  },
});
