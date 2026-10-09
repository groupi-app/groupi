import { ConvexError } from 'convex/values';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { requirePerson, livePerson } from './model';
export type ReadCtx = QueryCtx | MutationCtx;
export function membershipFor(
  ctx: ReadCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  return ctx.db
    .query('groupMemberships')
    .withIndex('by_groupId_and_personId', q =>
      q.eq('groupId', groupId).eq('personId', personId)
    )
    .unique();
}
export async function requireManager(
  ctx: ReadCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  await requirePerson(ctx, personId);
  const group = await ctx.db.get(groupId);
  const member = await membershipFor(ctx, groupId, personId);
  if (!group)
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Group not found.' });
  if (!member || (member.role !== 'OWNER' && member.role !== 'MODERATOR'))
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'Group manager access is required.',
    });
  return group;
}
export function memberActions(
  actorId: Id<'persons'>,
  actorRole: 'OWNER' | 'MODERATOR' | 'MEMBER',
  targetId: Id<'persons'>,
  targetRole: 'OWNER' | 'MODERATOR' | 'MEMBER'
) {
  const ordinary =
    targetRole === 'MEMBER' &&
    actorId !== targetId &&
    (actorRole === 'OWNER' || actorRole === 'MODERATOR');
  return {
    canRemove: ordinary,
    canBan: ordinary,
    canChangeRole:
      actorRole === 'OWNER' && targetRole !== 'OWNER' && actorId !== targetId,
  };
}

export async function isGroupBanned(
  ctx: ReadCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  const ban = await ctx.db
    .query('groupBans')
    .withIndex('by_groupId_and_personId', q =>
      q.eq('groupId', groupId).eq('personId', personId)
    )
    .unique();
  return ban?.active === true;
}
/** Eligibility shared by invitation and future application admission paths. */
export async function canEnterGroup(
  ctx: ReadCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  return (
    Boolean(await ctx.db.get(groupId)) &&
    Boolean(await livePerson(ctx, personId)) &&
    !(await isGroupBanned(ctx, groupId, personId))
  );
}
