import { paginationResultValidator } from 'convex/server';
import { resetPreferenceFor } from './announcementPreferenceModel';
import { v, type Infer } from 'convex/values';
import {
  mutation,
  query,
  internalMutation,
  internalQuery,
} from '../_generated/server';
import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { requireAuth, authComponent, type AuthUserId } from '../auth';
import { requireLegacyWriteCredential } from '../api/legacyCredential';
import { requireManager, membershipFor } from './policy';
import { requireWriteRole } from '../events/writes';
import { removeMemberForPerson } from '../events/management';
import { isEventComplete } from '../events/lifecycle';
import {
  priorReceipt,
  receiptBinding,
  saveReceipt,
  operationError,
} from './operationReceipts';
const args = {
  groupId: v.id('groups'),
  personId: v.id('persons'),
  operationId: v.string(),
};
export const expulsionResult = v.object({
  operationId: v.string(),
  outcome: v.literal('committed'),
  exclusion: v.union(v.literal('active'), v.literal('inactive')),
  generation: v.number(),
  cleanup: v.union(
    v.literal('pending'),
    v.literal('blocked'),
    v.literal('complete')
  ),
  conflicts: v.array(v.object({ eventId: v.id('events'), code: v.string() })),
  events: v.optional(
    v.array(
      v.object({
        eventId: v.id('events'),
        state: v.union(
          v.literal('pending'),
          v.literal('blocked'),
          v.literal('complete'),
          v.literal('preserved'),
          v.literal('retired')
        ),
        code: v.optional(v.string()),
      })
    )
  ),
});
/** Additional audited community policy. Ordinary removal and bans retain independent semantics. */
export async function expelForPerson(
  ctx: MutationCtx,
  actorId: Id<'persons'>,
  input: {
    groupId: Id<'groups'>;
    personId: Id<'persons'>;
    operationId: string;
  },
  authority = 'native'
): Promise<Infer<typeof expulsionResult>> {
  const group = await requireManager(ctx, input.groupId, actorId);
  const now = Date.now();
  const binding = await receiptBinding({
    actorId,
    authority,
    operation: 'expelCommunityMember',
    ...input,
  });
  const previous = await priorReceipt(ctx, input.operationId, binding, now);
  if (previous) return JSON.parse(previous) as Infer<typeof expulsionResult>;
  if (!(await ctx.db.get(input.personId)))
    operationError('RECIPIENT_UNAVAILABLE', 'This person is unavailable.');
  if (group.ownerId === input.personId)
    operationError('PROTECTED_OWNER', 'Transfer Group ownership first.');

  const existing = await ctx.db
    .query('communityExclusions')
    .withIndex('by_group_person', q =>
      q.eq('groupId', input.groupId).eq('personId', input.personId)
    )
    .unique();
  if (existing?.active)
    operationError(
      'CONFLICT',
      'Exclusion already active. Reconcile staff progress.'
    );
  const eventIds: Id<'events'>[] = [];
  const conflicts: { eventId: Id<'events'>; code: string }[] = [];
  for await (const link of ctx.db
    .query('groupEventAudiences')
    .withIndex('by_groupId', q => q.eq('groupId', input.groupId))) {
    const event = await ctx.db.get(link.eventId);
    if (!event || isEventComplete(event, now)) continue;
    eventIds.push(event._id);
    const members = await ctx.db
      .query('memberships')
      .withIndex('by_event', q => q.eq('eventId', event._id))
      .collect();
    const target = members.find(m => m.personId === input.personId);
    const actor = members.find(m => m.personId === actorId);
    if (target?.role === 'ORGANIZER')
      conflicts.push({ eventId: event._id, code: 'PROTECTED_ORGANIZER' });
    else if (actor?.role !== 'ORGANIZER')
      conflicts.push({ eventId: event._id, code: 'EVENT_AUTHORITY_REQUIRED' });
  }
  const generation = (existing?.generation ?? 0) + 1;
  const cleanup = conflicts.length
    ? ('blocked' as const)
    : ('pending' as const);
  const record = {
    groupId: input.groupId,
    personId: input.personId,
    actorId,
    active: true,
    generation,
    operationId: input.operationId,
    eventIds,
    events: eventIds.map(eventId => {
      const conflict = conflicts.find(c => c.eventId === eventId);
      return {
        eventId,
        state: conflict ? ('blocked' as const) : ('pending' as const),
        ...(conflict ? { code: conflict.code } : {}),
      };
    }),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    cleanup,
    conflicts,
  };
  if (existing) await ctx.db.replace(existing._id, record);
  else await ctx.db.insert('communityExclusions', record);
  const result = {
    operationId: input.operationId,
    outcome: 'committed' as const,
    exclusion: 'active' as const,
    generation,
    cleanup,
    conflicts,
    events: record.events,
  };
  await ctx.db.insert('communityExclusionAudit', {
    groupId: input.groupId,
    personId: input.personId,
    actorId,
    generation: result.generation,
    operationId: input.operationId,
    action: 'expel',
    at: now,
  });
  await saveReceipt(ctx, input.operationId, binding, result, now);
  return result;
}
export const expel = mutation({
  args,
  returns: expulsionResult,
  handler: async (ctx, input) =>
    expelForPerson(ctx, (await requireAuth(ctx)).person._id, input),
});
export const progress = query({
  args: { groupId: v.id('groups'), personId: v.id('persons') },
  returns: v.union(v.null(), expulsionResult),
  handler: async (ctx, input) => {
    await requireManager(
      ctx,
      input.groupId,
      (await requireAuth(ctx)).person._id
    );
    const record = await ctx.db
      .query('communityExclusions')
      .withIndex('by_group_person', q =>
        q.eq('groupId', input.groupId).eq('personId', input.personId)
      )
      .unique();
    if (!record) return null;
    return {
      operationId: record.operationId,
      outcome: 'committed' as const,
      exclusion: record.active ? ('active' as const) : ('inactive' as const),
      generation: record.generation,
      cleanup: record.cleanup,
      conflicts: record.conflicts,
      events: record.events,
    };
  },
});

export const expelRest = internalMutation({
  args: {
    ...args,
    actorId: v.id('persons'),
    credentialId: v.string(),
    policy: v.literal('coordinated'),
  },
  returns: expulsionResult,
  handler: async (
    ctx,
    { actorId, credentialId, policy: _policy, ...input }
  ) => {
    await requireLegacyWriteCredential(ctx, actorId, credentialId, 'groups');
    return expelForPerson(ctx, actorId, input, `legacy:${credentialId}`);
  },
});
export const progressRest = internalQuery({
  args: {
    groupId: v.id('groups'),
    personId: v.id('persons'),
    actorId: v.id('persons'),
  },
  returns: v.union(v.null(), expulsionResult),
  handler: async (ctx, { groupId, personId, actorId }) => {
    await requireManager(ctx, groupId, actorId);
    const record = await ctx.db
      .query('communityExclusions')
      .withIndex('by_group_person', q =>
        q.eq('groupId', groupId).eq('personId', personId)
      )
      .unique();
    return record
      ? {
          operationId: record.operationId,
          outcome: 'committed' as const,
          exclusion: record.active
            ? ('active' as const)
            : ('inactive' as const),
          generation: record.generation,
          cleanup: record.cleanup,
          conflicts: record.conflicts,
          events: record.events,
        }
      : null;
  },
});

const resolutionArgs = { ...args, generation: v.number() };
type ResolutionInput = {
  groupId: Id<'groups'>;
  personId: Id<'persons'>;
  generation: number;
  operationId: string;
};
async function currentExclusion(ctx: MutationCtx, input: ResolutionInput) {
  const record = await ctx.db
    .query('communityExclusions')
    .withIndex('by_group_person', q =>
      q.eq('groupId', input.groupId).eq('personId', input.personId)
    )
    .unique();
  if (!record?.active || record.generation !== input.generation)
    operationError(
      'STALE_GENERATION',
      'Reconcile the current exclusion generation before resolving it.'
    );
  return record;
}
/** A retry is a new explicit intent; an uncertain response retries its original UUID.
 * Each transaction processes a bounded page. Earlier committed pages survive later failures.
 * Never trusts stored completion: completion, audience and membership may have changed.
 */
export async function resolveForPerson(
  ctx: MutationCtx,
  actorId: Id<'persons'>,
  input: ResolutionInput,
  action: 'resume' | 'reinstate',
  authority = 'native'
): Promise<Infer<typeof expulsionResult>> {
  const group = await requireManager(ctx, input.groupId, actorId);
  const now = Date.now();
  const binding = await receiptBinding({
    actorId,
    authority,
    operation: `${action}CommunityMember`,
    ...input,
  });
  const prior = await priorReceipt(ctx, input.operationId, binding, now);
  if (prior) return JSON.parse(prior) as Infer<typeof expulsionResult>;
  const record = await currentExclusion(ctx, input);
  if (group.ownerId === input.personId)
    operationError('PROTECTED_OWNER', 'Transfer Group ownership first.');
  // Captured IDs remain applicable even after audience withdrawal. Reconcile current links too.
  const eventIds = [...record.eventIds];
  for await (const link of ctx.db
    .query('groupEventAudiences')
    .withIndex('by_groupId', q => q.eq('groupId', input.groupId))) {
    if (!eventIds.includes(link.eventId)) eventIds.push(link.eventId);
  }
  const events: NonNullable<Infer<typeof expulsionResult>['events']> = [];
  const conflicts: Infer<typeof expulsionResult>['conflicts'] = [];
  let writes = 0;
  const person = await ctx.db.get(input.personId);
  const user = person
    ? await authComponent.getAnyUserById(ctx, person.userId as AuthUserId)
    : null;
  for (const eventId of eventIds) {
    const event = await ctx.db.get(eventId);
    if (!event) {
      events.push({ eventId, state: 'retired' });
      continue;
    }
    if (isEventComplete(event, now)) {
      events.push({ eventId, state: 'preserved' });
      continue;
    }
    const target = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', input.personId).eq('eventId', eventId)
      )
      .first();
    const invites = await ctx.db
      .query('eventInvites')
      .withIndex('by_event_invitee', q =>
        q.eq('eventId', eventId).eq('inviteeId', input.personId)
      )
      .collect();
    const pending = invites.filter(i => i.status === 'PENDING');
    // Recipient email invites are revocable; shared token invitations belong to nobody.
    const emailInvites = user?.email
      ? (
          await ctx.db
            .query('invites')
            .withIndex('by_event', q => q.eq('eventId', eventId))
            .collect()
        ).filter(i => i.email?.toLowerCase() === user.email.toLowerCase())
      : [];
    if (!target && !pending.length && !emailInvites.length) {
      events.push({ eventId, state: 'complete' });
      continue;
    }
    if (action === 'reinstate')
      operationError(
        'CLEANUP_REQUIRED',
        'Resume cleanup before reinstatement; existing participation or invitations would regain access.'
      );
    let code: string | undefined;
    if (target?.role === 'ORGANIZER') code = 'PROTECTED_ORGANIZER';
    else {
      try {
        await requireWriteRole(ctx, eventId, actorId, 'ORGANIZER');
      } catch (cause) {
        if (!(cause instanceof Error) || !cause.message.includes('FORBIDDEN'))
          throw cause;
        code = 'EVENT_AUTHORITY_REQUIRED';
      }
    }
    if (code) {
      conflicts.push({ eventId, code });
      events.push({ eventId, state: 'blocked', code });
      continue;
    }
    if (writes >= 10) {
      events.push({ eventId, state: 'pending' });
      continue;
    }
    writes++;
    // All eligibility and generation reads are in this write transaction; a concurrent
    // reinstatement/authority change forces retry before any destructive write commits.
    if (target) await removeMemberForPerson(ctx, actorId, target._id);
    for (const invite of pending)
      await ctx.db.patch(invite._id, { status: 'CANCELLED', respondedAt: now });
    for (const invite of emailInvites) await ctx.db.delete(invite._id);
    events.push({ eventId, state: 'complete' });
  }
  const membership = await membershipFor(ctx, input.groupId, input.personId);
  const groupInvites = await ctx.db
    .query('groupInvites')
    .withIndex('by_groupId_and_inviteeId', q =>
      q.eq('groupId', input.groupId).eq('inviteeId', input.personId)
    )
    .collect();
  if (
    action === 'reinstate' &&
    (record.cleanup !== 'complete' ||
      membership ||
      groupInvites.some(i => i.status === 'PENDING'))
  )
    operationError(
      'CLEANUP_REQUIRED',
      'Resolve all cleanup before reinstatement. Fresh admission is required.'
    );
  if (action === 'resume') {
    await resetPreferenceFor(ctx, input.groupId, input.personId);
    if (membership) {
      await ctx.db.delete(membership._id);
      await ctx.db.patch(group._id, {
        memberCount: Math.max(0, group.memberCount - 1),
      });
    }
    for (const invite of groupInvites)
      if (invite.status === 'PENDING')
        await ctx.db.patch(invite._id, {
          status: 'CANCELLED',
          respondedAt: now,
        });
  }
  const cleanup = conflicts.length
    ? ('blocked' as const)
    : events.some(e => e.state === 'pending')
      ? ('pending' as const)
      : ('complete' as const);
  await ctx.db.patch(record._id, {
    eventIds,
    events,
    conflicts,
    cleanup,
    updatedAt: now,
    ...(action === 'reinstate'
      ? { active: false, reinstatedAt: now, reinstatedBy: actorId }
      : {}),
  });
  const result = {
    operationId: input.operationId,
    outcome: 'committed' as const,
    exclusion:
      action === 'reinstate' ? ('inactive' as const) : ('active' as const),
    generation: record.generation,
    cleanup,
    conflicts,
    events,
  };
  await ctx.db.insert('communityExclusionAudit', {
    groupId: input.groupId,
    personId: input.personId,
    actorId,
    generation: record.generation,
    operationId: input.operationId,
    action,
    at: now,
  });
  await saveReceipt(ctx, input.operationId, binding, result, now);
  return result;
}
export const resume = mutation({
  args: resolutionArgs,
  returns: expulsionResult,
  handler: async (ctx, input) =>
    resolveForPerson(ctx, (await requireAuth(ctx)).person._id, input, 'resume'),
});
export const reinstate = mutation({
  args: resolutionArgs,
  returns: expulsionResult,
  handler: async (ctx, input) =>
    resolveForPerson(
      ctx,
      (await requireAuth(ctx)).person._id,
      input,
      'reinstate'
    ),
});
export const resolveRest = internalMutation({
  args: {
    ...resolutionArgs,
    actorId: v.id('persons'),
    credentialId: v.string(),
    action: v.union(v.literal('resume'), v.literal('reinstate')),
  },
  returns: expulsionResult,
  handler: async (ctx, { actorId, credentialId, action, ...input }) => {
    await requireLegacyWriteCredential(ctx, actorId, credentialId, 'groups');
    return resolveForPerson(
      ctx,
      actorId,
      input,
      action,
      `legacy:${credentialId}`
    );
  },
});

/** Staff can find excluded former members after their roster rows have been removed. */
export const progressPage = paginationResultValidator(
  v.object({ personId: v.id('persons'), name: v.string() })
);
export const listProgress = query({
  args: { groupId: v.id('groups'), cursor: v.optional(v.string()) },
  returns: progressPage,
  handler: async (ctx, { groupId, cursor }) => {
    await requireManager(ctx, groupId, (await requireAuth(ctx)).person._id);
    const page = await ctx.db
      .query('communityExclusions')
      .withIndex('by_group', q => q.eq('groupId', groupId))
      .paginate({ cursor: cursor ?? null, numItems: 20 });
    return {
      ...page,
      page: await Promise.all(
        page.page.map(async row => {
          const person = await ctx.db.get(row.personId);
          const user = person
            ? await authComponent.getAnyUserById(
                ctx,
                person.userId as AuthUserId
              )
            : null;
          return {
            personId: row.personId,
            name: user?.name ?? 'Unavailable person',
          };
        })
      ),
    };
  },
});
