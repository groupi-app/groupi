import { ConvexError } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import { requireOwner, requirePerson, livePerson } from '../groups/model';
import { membershipFor, canEnterGroup } from '../groups/policy';
import { checkIsBlocked } from '../lib/privacy';
export const explanation =
  'The current owner remains responsible until the recipient accepts. After acceptance the former owner becomes a Moderator. Group membership, links and independent Events stay unchanged.';
function fail(code: string, message: string): never {
  throw new ConvexError({ code, message });
}
async function currentOwner(
  ctx: QueryCtx | MutationCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  const group = await requireOwner(ctx, groupId, personId);
  const owner = await ctx.db
    .query('groupMemberships')
    .withIndex('by_groupId_and_role', q =>
      q.eq('groupId', groupId).eq('role', 'OWNER')
    )
    .unique();
  if (!owner || owner.personId !== personId)
    fail('CONFLICT', 'Group ownership is inconsistent.');
  return { group, owner };
}
async function eligibleMember(
  ctx: QueryCtx | MutationCtx,
  groupId: Id<'groups'>,
  ownerId: Id<'persons'>,
  recipientId: Id<'persons'>
) {
  const member = await membershipFor(ctx, groupId, recipientId);
  if (
    recipientId === ownerId ||
    !member ||
    member.role === 'OWNER' ||
    !(await canEnterGroup(ctx, groupId, recipientId)) ||
    (await checkIsBlocked(ctx, ownerId, recipientId))
  )
    return null;
  return member;
}
async function eligible(
  ctx: QueryCtx | MutationCtx,
  groupId: Id<'groups'>,
  ownerId: Id<'persons'>,
  recipientId: Id<'persons'>
) {
  const member = await eligibleMember(ctx, groupId, ownerId, recipientId);
  if (!member) fail('FORBIDDEN', 'Choose an eligible admitted Group member.');
  return member;
}
export async function statusForPerson(
  ctx: QueryCtx | MutationCtx,
  personId: Id<'persons'>,
  groupId: Id<'groups'>
) {
  await requirePerson(ctx, personId);
  const group = await ctx.db.get(groupId);
  if (!group) return null;
  const member = await membershipFor(ctx, groupId, personId);
  if (!member) return null;
  const transfer = await ctx.db
    .query('groupTransfers')
    .withIndex('by_group', q => q.eq('groupId', groupId))
    .order('desc')
    .first();
  if (
    group.ownerId !== personId &&
    transfer?.recipientId !== personId &&
    transfer?.offeredById !== personId
  )
    return null;
  const recipient = transfer?.recipientId
    ? await livePerson(ctx, transfer.recipientId)
    : null;
  const owner = member.role === 'OWNER' && group.ownerId === personId;
  const pending =
    transfer?.status === 'PENDING' && transfer.offeredById === group.ownerId;
  const canAccept =
    !!pending &&
    transfer?.recipientId === personId &&
    !!(await livePerson(ctx, group.ownerId)) &&
    !!(await eligibleMember(ctx, groupId, group.ownerId, personId));
  return {
    groupId,
    ownerId: group.ownerId,
    transferId: transfer?._id ?? null,
    offeredById: transfer?.offeredById ?? null,
    recipientId: transfer?.recipientId ?? null,
    recipient: recipient
      ? {
          personId: recipient.person._id,
          name: recipient.user.name ?? null,
          username: recipient.user.username ?? null,
          image: recipient.user.image ?? null,
        }
      : null,
    status: transfer?.status ?? ('NONE' as const),
    explanation,
    canOffer: owner && !pending,
    canAccept,
    canDecline: !!pending && transfer?.recipientId === personId,
    canCancel: !!pending && owner,
  };
}
export async function offerForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  groupId: Id<'groups'>,
  recipientId: Id<'persons'>
) {
  await currentOwner(ctx, groupId, personId);
  await eligible(ctx, groupId, personId, recipientId);
  const pending = await ctx.db
    .query('groupTransfers')
    .withIndex('by_group_status', q =>
      q.eq('groupId', groupId).eq('status', 'PENDING')
    )
    .unique();
  if (pending) {
    if (pending.offeredById === personId && pending.recipientId === recipientId)
      return statusForPerson(ctx, personId, groupId);
    fail(
      'CONFLICT',
      'Cancel the pending ownership offer before choosing another member.'
    );
  }
  await ctx.db.insert('groupTransfers', {
    groupId,
    offeredById: personId,
    recipientId,
    status: 'PENDING',
    offeredAt: Date.now(),
  });
  return statusForPerson(ctx, personId, groupId);
}
export async function decideForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  groupId: Id<'groups'>,
  transferId: Id<'groupTransfers'>,
  decision: 'ACCEPTED' | 'DECLINED' | 'CANCELLED'
) {
  await requirePerson(ctx, personId);
  const transfer = await ctx.db.get(transferId),
    group = await ctx.db.get(groupId);
  if (!transfer || transfer.groupId !== groupId || !group)
    fail('NOT_FOUND', 'Ownership offer is unavailable.');
  const latest = await ctx.db
    .query('groupTransfers')
    .withIndex('by_group', q => q.eq('groupId', groupId))
    .order('desc')
    .first();
  if (latest?._id !== transferId)
    fail('CONFLICT', 'This ownership offer is no longer current.');
  if (decision === 'CANCELLED') {
    await currentOwner(ctx, groupId, personId);
    if (transfer.offeredById !== personId)
      fail('FORBIDDEN', 'Only the offering owner can cancel.');
  } else if (transfer.recipientId !== personId)
    fail('FORBIDDEN', 'Only the intended recipient can accept or decline.');
  if (transfer.status === decision)
    return statusForPerson(ctx, personId, groupId);
  if (transfer.status !== 'PENDING')
    fail('CONFLICT', 'This ownership offer is no longer pending.');
  if (!transfer.offeredById || group.ownerId !== transfer.offeredById)
    fail('CONFLICT', 'The offering owner is no longer responsible.');
  const { owner } = await currentOwner(ctx, groupId, transfer.offeredById);
  if (decision === 'ACCEPTED') {
    const recipient = await eligible(
      ctx,
      groupId,
      transfer.offeredById,
      personId
    );
    await ctx.db.patch(owner._id, { role: 'MODERATOR' });
    await ctx.db.patch(recipient._id, { role: 'OWNER' });
    await ctx.db.patch(groupId, { ownerId: personId, updatedAt: Date.now() });
  }
  await ctx.db.patch(transferId, { status: decision, resolvedAt: Date.now() });
  return statusForPerson(ctx, personId, groupId);
}
