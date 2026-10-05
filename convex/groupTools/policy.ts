import { ConvexError } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { requireOwner, requirePerson } from '../groups/model';
import { membershipFor, isGroupBanned } from '../groups/policy';
import { requireGroupMemberContent } from '../groups/contentAccess';
type ReadCtx = MutationCtx | QueryCtx;
export async function getPolicy(
  ctx: ReadCtx,
  groupId: Id<'groups'>,
  kind: 'FORM' | 'POLL' | 'LIST'
) {
  const row = await ctx.db
    .query('groupToolPolicies')
    .withIndex('by_groupId_and_kind', q =>
      q.eq('groupId', groupId).eq('kind', kind)
    )
    .unique();
  return {
    groupId,
    kind,
    enabled: row?.enabled ?? true,
    creation: row?.creation ?? ('MANAGERS' as const),
  };
}
export async function readPolicy(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  groupId: Id<'groups'>,
  kind: 'FORM' | 'POLL' | 'LIST' = 'FORM'
) {
  await requirePerson(ctx, personId);
  const member = await membershipFor(ctx, groupId, personId);
  if (!member || (await isGroupBanned(ctx, groupId, personId)))
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'Current Group membership required.',
    });
  return {
    ...(await getPolicy(ctx, groupId, kind)),
    canConfigure: member.role === 'OWNER',
  };
}
export async function setPolicy(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  input: {
    groupId: Id<'groups'>;
    enabled: boolean;
    creation: 'MANAGERS' | 'MEMBERS';
  },
  kind: 'FORM' | 'POLL' | 'LIST' = 'FORM'
) {
  await requireOwner(ctx, input.groupId, personId);
  const row = await ctx.db
    .query('groupToolPolicies')
    .withIndex('by_groupId_and_kind', q =>
      q.eq('groupId', input.groupId).eq('kind', kind)
    )
    .unique();
  if (row) await ctx.db.patch(row._id, { ...input });
  else await ctx.db.insert('groupToolPolicies', { ...input, kind });
  return null;
}
/** Shared creation seam for separately implemented persistent tool interactions. */
export async function requireToolCreation(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  groupId: Id<'groups'>,
  kind: 'FORM' | 'POLL' | 'LIST'
) {
  await requireGroupMemberContent(ctx, groupId, personId);
  const policy = await getPolicy(ctx, groupId, kind);
  const member = await membershipFor(ctx, groupId, personId);
  if (
    !policy.enabled ||
    (policy.creation === 'MANAGERS' && member?.role === 'MEMBER')
  )
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'Tool creation is unavailable under current owner policy.',
    });
}
/** Shared mounting/read/write availability check; owning private recovery is separate. */
export async function requireToolInteraction(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  groupId: Id<'groups'>,
  kind: 'FORM' | 'POLL' | 'LIST'
) {
  await requireGroupMemberContent(ctx, groupId, personId);
  if (!(await getPolicy(ctx, groupId, kind)).enabled)
    throw new ConvexError({
      code: 'FORBIDDEN',
      message:
        'This Group tool type is disabled. Own saved responses remain available in history.',
    });
}
