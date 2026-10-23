import {
  isEventExcludedForPerson,
  isGroupExcludedForPerson,
} from './exclusions';
import { currentEventForPerson } from './currentEvent';
import { checkIsBlocked } from '../lib/privacy';
import { v, type Infer } from 'convex/values';
import { internalMutation, mutation } from '../_generated/server';
import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { requireAuth } from '../auth';
import { authorizeCommunity } from './community';
import { denied } from '../authorization/model';
import { membershipFor } from './policy';
import { requirePerson } from './model';
import { canAccessGroupMemberContent } from './contentAccess';
import { eventAdmissionAccess } from '../events/admission';
import { isEventComplete } from '../events/lifecycle';
import {
  joinDiscoverableEventForPerson,
  leaveEventForPerson,
} from '../events/management';
import { updateRSVPForPerson } from '../events/scheduling';
import { participationRevision } from '../events/participationRevision';
import { leave } from '../groupModeration/model';
import { rsvpChoices } from '../availability/contracts';
import {
  operationError,
  priorReceipt,
  receiptBinding,
  saveReceipt,
} from './operationReceipts';
const operation = v.union(
  v.literal('join'),
  v.literal('rsvp'),
  v.literal('leave-event'),
  v.literal('leave-group')
);
const actions = {
  join: 'groups.events.join',
  rsvp: 'groups.events.rsvp',
  'leave-event': 'groups.events.leave',
  'leave-group': 'groups.leave',
} as const;
const result = v.union(
  v.object({
    eventId: v.id('events'),
    participation: v.object({
      membershipId: v.id('memberships'),
      revision: v.number(),
      rsvp: v.union(
        v.literal('PENDING'),
        v.literal('YES'),
        v.literal('NO'),
        v.literal('MAYBE')
      ),
    }),
  }),
  v.object({ eventId: v.id('events'), participation: v.null() }),
  v.object({
    membership: v.null(),
    retainsIndependentEventParticipation: v.literal(true),
  })
);
export const receipt = v.object({
  operationId: v.string(),
  outcome: v.literal('committed'),
  result,
  effects: v.object({
    email: v.literal('not-requested'),
    cleanup: v.literal('not-requested'),
  }),
});
const intent = {
  groupId: v.string(),
  eventId: v.optional(v.string()),
  operationId: v.string(),
  operation,
  bodyJson: v.string(),
};
async function executeForPerson(
  ctx: MutationCtx,
  args: Infer<typeof vIntent>,
  personId: Id<'persons'>,
  authority: unknown
) {
  await requirePerson(ctx, personId);
  const groupId = ctx.db.normalizeId('groups', args.groupId);
  if (
    !groupId ||
    !(await ctx.db.get(groupId)) ||
    (await isGroupExcludedForPerson(ctx, groupId, personId))
  )
    throw denied();
  let body: unknown;
  try {
    body = JSON.parse(args.bodyJson);
  } catch {
    operationError('VALIDATION_ERROR', 'Invalid JSON.');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body))
    operationError('VALIDATION_ERROR', 'Invalid request.');
  const fields = body as Record<string, unknown>;
  const expected =
    args.operation === 'join'
      ? []
      : args.operation === 'rsvp'
        ? ['expectedRevision', 'rsvp']
        : args.operation === 'leave-event'
          ? ['expectedRevision']
          : ['expectedMembershipId'];
  if (
    Object.keys(fields).some(k => !expected.includes(k)) ||
    expected.some(k => !(k in fields))
  )
    operationError('VALIDATION_ERROR', 'Invalid request fields.');
  if (
    expected.includes('expectedRevision') &&
    (typeof fields.expectedRevision !== 'number' ||
      !Number.isSafeInteger(fields.expectedRevision))
  )
    operationError(
      'VALIDATION_ERROR',
      'Expected participation revision is required.'
    );
  if (
    args.operation === 'rsvp' &&
    !rsvpChoices.includes(fields.rsvp as (typeof rsvpChoices)[number])
  )
    operationError('VALIDATION_ERROR', 'Invalid RSVP choice.');
  if (
    args.operation === 'leave-group' &&
    typeof fields.expectedMembershipId !== 'string'
  )
    operationError(
      'VALIDATION_ERROR',
      'Expected Group membership ID is required.'
    );
  const eventId = args.eventId
    ? ctx.db.normalizeId('events', args.eventId)
    : null;
  const group = await ctx.db.get(groupId);
  const member = await membershipFor(ctx, groupId, personId);
  let access;
  if (args.operation === 'leave-group') {
    if (group!.ownerId === personId || member?.role === 'OWNER')
      operationError(
        'PROTECTED_OWNER',
        'Transfer Group ownership before leaving.'
      );
  } else {
    if (!eventId) throw denied();
    const event = await ctx.db.get(eventId);
    const link = await ctx.db
      .query('groupEventAudiences')
      .withIndex('by_groupId_and_eventId', q =>
        q.eq('groupId', groupId).eq('eventId', eventId)
      )
      .unique();
    if (
      !event ||
      !link ||
      isEventComplete(event, Date.now()) ||
      (await isEventExcludedForPerson(ctx, eventId, personId))
    )
      throw denied();
    const ban = await ctx.db
      .query('eventBans')
      .withIndex('by_person_event', q =>
        q.eq('personId', personId).eq('eventId', eventId)
      )
      .first();
    if (ban || (await checkIsBlocked(ctx, personId, event.creatorId)))
      throw denied();
    access = await eventAdmissionAccess(ctx, event, personId);
    if (
      args.operation === 'join' &&
      !access.membership &&
      !(await canAccessGroupMemberContent(ctx, groupId, personId))
    )
      throw denied();
    // Current independent membership survives voluntary departure; old audience alone does not.
    if (
      access.membership?.role === 'ORGANIZER' &&
      args.operation === 'leave-event'
    ) {
      const organizers = await ctx.db
        .query('memberships')
        .withIndex('by_event_role', q =>
          q.eq('eventId', eventId).eq('role', 'ORGANIZER')
        )
        .collect();
      if (organizers.length <= 1)
        operationError(
          'PROTECTED_ORGANIZER',
          'Transfer Event Organizer authority before leaving.'
        );
    }
  }
  const binding = await receiptBinding({
    actorId: personId,
    authority,
    groupId,
    eventId: eventId ?? undefined,
    operation: args.operation,
    body: fields,
  });
  const now = Date.now();
  const prior = await priorReceipt(ctx, args.operationId, binding, now);
  if (prior) return JSON.parse(prior) as Infer<typeof receipt>;
  if (args.operation !== 'leave-group') {
    const current = await currentEventForPerson(ctx, groupId, personId, []);
    if (current.kind === 'conflict')
      operationError(
        'STAFF_CONFIGURATION_CONFLICT',
        'Staff must resolve the current Event configuration.'
      );
    if (current.kind !== 'event' || current.event.id !== eventId)
      throw denied();
  }
  let changed: Infer<typeof result>;
  if (args.operation === 'leave-group') {
    if (!member || member._id !== fields.expectedMembershipId)
      operationError(
        'STALE_REVISION',
        'Group membership changed. Read current own context.'
      );
    await leave(ctx, personId, groupId);
    changed = { membership: null, retainsIndependentEventParticipation: true };
  } else {
    const membership = access!.membership;
    if (args.operation === 'join') {
      if (!membership) {
        if (
          !(await canAccessGroupMemberContent(ctx, groupId, personId)) ||
          !access!.canJoin
        )
          throw denied();
        await joinDiscoverableEventForPerson(ctx, personId, eventId!);
      }
    } else {
      if (
        !membership ||
        participationRevision(membership) !== fields.expectedRevision
      )
        operationError(
          'STALE_REVISION',
          'Participation changed. Read current own RSVP.'
        );
      if (args.operation === 'rsvp')
        await updateRSVPForPerson(ctx, personId, {
          eventId: eventId!,
          rsvpStatus: fields.rsvp as (typeof rsvpChoices)[number],
        });
      else await leaveEventForPerson(ctx, personId, eventId!);
    }
    if (args.operation === 'leave-event')
      changed = { eventId: eventId!, participation: null };
    else {
      const current = await ctx.db
        .query('memberships')
        .withIndex('by_person_event', q =>
          q.eq('personId', personId).eq('eventId', eventId!)
        )
        .first();
      changed = {
        eventId: eventId!,
        participation: {
          membershipId: current!._id,
          revision: participationRevision(current!),
          rsvp: current!.rsvpStatus,
        },
      };
    }
  }
  const committed = {
    operationId: args.operationId,
    outcome: 'committed' as const,
    result: changed,
    effects: {
      email: 'not-requested' as const,
      cleanup: 'not-requested' as const,
    },
  };
  await saveReceipt(ctx, args.operationId, binding, committed, now);
  return committed;
}
const vIntent = v.object(intent);
export const execute = internalMutation({
  args: { credentialId: v.id('authorizationCredentials'), ...intent },
  returns: receipt,
  handler: async (ctx, args) => {
    const { grant, personId } = await authorizeCommunity(
      ctx,
      args,
      actions[args.operation]
    );
    return executeForPerson(ctx, args, personId, {
      appId: grant.appId,
      issuer: grant.instanceId,
    });
  },
});
export const participate = mutation({
  args: intent,
  returns: receipt,
  handler: async (ctx, args) =>
    executeForPerson(ctx, args, (await requireAuth(ctx)).person._id, {
      native: true,
    }),
});
