import { components } from '../_generated/api';
import type { Doc as AuthDoc } from '../betterAuth/_generated/dataModel';
import { accountActive } from '../authorization/model';
import { v, type Infer } from 'convex/values';
import {
  mutation,
  query,
  internalMutation,
  internalQuery,
} from '../_generated/server';
import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { requireAuth } from '../auth';
import { requireManager } from './policy';
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
  exclusion: v.literal('active'),
  generation: v.number(),
  cleanup: v.union(
    v.literal('pending'),
    v.literal('blocked'),
    v.literal('complete')
  ),
  conflicts: v.array(v.object({ eventId: v.id('events'), code: v.string() })),
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
  };
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
    if (!record?.active) return null;
    return {
      operationId: record.operationId,
      outcome: 'committed' as const,
      exclusion: 'active' as const,
      generation: record.generation,
      cleanup: record.cleanup,
      conflicts: record.conflicts,
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
    const person = await accountActive(ctx, actorId, Date.now());
    const records = await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: 'apikey',
      where: [{ field: '_id', operator: 'eq', value: credentialId }],
      paginationOpts: { cursor: null, numItems: 1 },
    });
    const key = records.page[0] as AuthDoc<'apikey'> | undefined;
    if (
      !key ||
      key.userId !== person.userId ||
      key.enabled === false ||
      (key.expiresAt != null && key.expiresAt <= Date.now())
    )
      operationError('FORBIDDEN', 'Current staff credential required.');
    if (key.permissions != null) {
      let permissions: unknown;
      try {
        permissions = JSON.parse(key.permissions);
      } catch {
        operationError('FORBIDDEN', 'Groups write scope required.');
      }
      if (
        !permissions ||
        typeof permissions !== 'object' ||
        !('groups' in permissions) ||
        !Array.isArray(permissions.groups) ||
        !permissions.groups.includes('write')
      )
        operationError('FORBIDDEN', 'Groups write scope required.');
    }
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
    return record?.active
      ? {
          operationId: record.operationId,
          outcome: 'committed' as const,
          exclusion: 'active' as const,
          generation: record.generation,
          cleanup: record.cleanup,
          conflicts: record.conflicts,
        }
      : null;
  },
});
