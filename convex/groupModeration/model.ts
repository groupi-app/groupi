import { ConvexError } from 'convex/values';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { requireOwner, requirePerson, livePerson } from '../groups/model';
import { membershipFor, requireManager } from '../groups/policy';
import { createNotification } from '../lib/notifications';
function fail(code: string, message: string): never {
  throw new ConvexError({ code, message });
}
export async function setRole(
  ctx: MutationCtx,
  actorId: Id<'persons'>,
  groupId: Id<'groups'>,
  personId: Id<'persons'>,
  role: 'MODERATOR' | 'MEMBER'
) {
  await requireOwner(ctx, groupId, actorId);
  await requirePerson(ctx, personId);
  const member = await membershipFor(ctx, groupId, personId);
  if (!member) fail('NOT_FOUND', 'Group member not found.');
  if (member.role === 'OWNER' || actorId === personId)
    fail('FORBIDDEN', 'The Group owner role cannot be changed.');
  if (member.role !== role) await ctx.db.patch(member._id, { role });
  return { role };
}
export async function removeMember(
  ctx: MutationCtx,
  actorId: Id<'persons'>,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  const group = await requireManager(ctx, groupId, actorId);
  if (actorId === personId)
    fail('FORBIDDEN', 'Use leave to depart from this Group.');
  const member = await membershipFor(ctx, groupId, personId);
  if (!member) return { removed: false };
  if (member.role !== 'MEMBER')
    fail('FORBIDDEN', 'Only ordinary members can be removed.');
  await ctx.db.delete(member._id);
  await ctx.db.patch(groupId, {
    memberCount: group.memberCount - 1,
    updatedAt: Date.now(),
  });
  await createNotification(
    ctx,
    { personId, authorId: actorId, type: 'GROUP_MEMBER_REMOVED', groupId },
    {
      messageContext: {
        groupTitle: group.name,
        authorName: (await requirePerson(ctx, actorId)).user.name,
        notificationUrl: `${process.env.SITE_URL || 'https://groupi.gg'}/g/${groupId}`,
      },
    }
  );
  return { removed: true };
}
export async function leave(
  ctx: MutationCtx,
  actorId: Id<'persons'>,
  groupId: Id<'groups'>
) {
  await requirePerson(ctx, actorId);
  const group = await ctx.db.get(groupId);
  if (!group) fail('NOT_FOUND', 'Group not found.');
  if (group.ownerId === actorId)
    fail('FORBIDDEN', 'The Group owner must resolve ownership before leaving.');
  const member = await membershipFor(ctx, groupId, actorId);
  if (!member) return { left: false };
  await ctx.db.delete(member._id);
  await ctx.db.patch(groupId, {
    memberCount: group.memberCount - 1,
    updatedAt: Date.now(),
  });
  return { left: true };
}

export async function ban(
  ctx: MutationCtx,
  actorId: Id<'persons'>,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  const group = await requireManager(ctx, groupId, actorId);
  if (actorId === personId)
    fail('FORBIDDEN', 'Managers cannot ban themselves.');
  const member = await membershipFor(ctx, groupId, personId);
  if (group.ownerId === personId || (member && member.role !== 'MEMBER'))
    fail('FORBIDDEN', 'Only ordinary members or nonmembers can be banned.');
  if (!(await livePerson(ctx, personId)))
    fail('RECIPIENT_UNAVAILABLE', 'This person is unavailable.');
  const existing = await ctx.db
    .query('groupBans')
    .withIndex('by_groupId_and_personId', q =>
      q.eq('groupId', groupId).eq('personId', personId)
    )
    .unique();
  if (existing?.active) return { banned: true as const };
  const data = {
    actorId,
    active: true,
    bannedAt: Date.now(),
    liftedBy: undefined,
    liftedAt: undefined,
  };
  if (existing) await ctx.db.patch(existing._id, data);
  else await ctx.db.insert('groupBans', { groupId, personId, ...data });
  if (member) {
    await ctx.db.delete(member._id);
    await ctx.db.patch(groupId, {
      memberCount: group.memberCount - 1,
      updatedAt: Date.now(),
    });
  }
  await createNotification(
    ctx,
    { personId, authorId: actorId, type: 'GROUP_MEMBER_BANNED', groupId },
    {
      messageContext: {
        groupTitle: group.name,
        authorName: (await requirePerson(ctx, actorId)).user.name,
        notificationUrl: `${process.env.SITE_URL || 'https://groupi.gg'}/g/${groupId}`,
      },
    }
  );
  return { banned: true as const };
}
export async function lift(
  ctx: MutationCtx,
  actorId: Id<'persons'>,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  await requireManager(ctx, groupId, actorId);
  const existing = await ctx.db
    .query('groupBans')
    .withIndex('by_groupId_and_personId', q =>
      q.eq('groupId', groupId).eq('personId', personId)
    )
    .unique();
  if (existing?.active)
    await ctx.db.patch(existing._id, {
      active: false,
      liftedAt: Date.now(),
      liftedBy: actorId,
    });
  return { banned: false as const };
}
export async function listBans(
  ctx: QueryCtx,
  actorId: Id<'persons'>,
  groupId: Id<'groups'>,
  paginationOpts: { numItems: number; cursor: string | null }
) {
  await requireManager(ctx, groupId, actorId);
  if (
    !Number.isInteger(paginationOpts.numItems) ||
    paginationOpts.numItems < 1 ||
    paginationOpts.numItems > 100
  )
    fail('VALIDATION_ERROR', 'Page size must be an integer from 1 to 100.');
  let result;
  try {
    result = await ctx.db
      .query('groupBans')
      .withIndex('by_groupId_and_active', q =>
        q.eq('groupId', groupId).eq('active', true)
      )
      .order('desc')
      .paginate(paginationOpts);
  } catch {
    fail('VALIDATION_ERROR', 'Invalid ban cursor.');
  }
  return {
    page: await Promise.all(
      result.page.map(async row => {
        const person = await livePerson(ctx, row.personId);
        return {
          personId: row.personId,
          name: person?.user.name ?? null,
          username: person?.user.username ?? null,
          image: person?.user.image ?? null,
          bannedAt: row.bannedAt,
        };
      })
    ),
    isDone: result.isDone,
    continueCursor: result.continueCursor,
  };
}
