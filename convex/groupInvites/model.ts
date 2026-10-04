import { ConvexError } from 'convex/values';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import { livePerson, requirePerson, requireOwner } from '../groups/model';
import { checkIfFriends, checkIsBlocked } from '../lib/privacy';
import { createNotification } from '../lib/notifications';
type ReadCtx = QueryCtx | MutationCtx;
function fail(code: string, message: string): never {
  throw new ConvexError({ code, message });
}
function unavailable(): never {
  fail('RECIPIENT_UNAVAILABLE', 'This recipient or invitation is unavailable.');
}
export async function requireManager(
  ctx: ReadCtx,
  groupId: Id<'groups'>,
  actorId: Id<'persons'>
) {
  return requireOwner(ctx, groupId, actorId);
}
async function membership(
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
async function canAccept(ctx: ReadCtx, invite: Doc<'groupInvites'>) {
  const group = await ctx.db.get(invite.groupId);
  if (
    !group ||
    group.invitationsEnabled === false ||
    !(await livePerson(ctx, invite.inviteeId)) ||
    !(await livePerson(ctx, invite.inviterId)) ||
    (await checkIsBlocked(ctx, invite.inviterId, invite.inviteeId))
  )
    return false;
  return true;
}
export async function send(
  ctx: MutationCtx,
  actorId: Id<'persons'>,
  groupId: Id<'groups'>,
  inviteePersonId: Id<'persons'>
) {
  const group = await requireManager(ctx, groupId, actorId);
  if (group.invitationsEnabled === false)
    fail('FORBIDDEN', 'Group invitations are disabled.');
  if (
    actorId === inviteePersonId ||
    !(await livePerson(ctx, inviteePersonId)) ||
    (await checkIsBlocked(ctx, actorId, inviteePersonId))
  )
    unavailable();
  const settings = await ctx.db
    .query('personSettings')
    .withIndex('by_person', q => q.eq('personId', inviteePersonId))
    .first();
  const privacy = settings?.allowGroupInvitesFrom ?? 'EVERYONE';
  if (
    privacy === 'NO_ONE' ||
    (privacy === 'FRIENDS' &&
      !(await checkIfFriends(ctx, actorId, inviteePersonId)))
  )
    unavailable();
  if (await membership(ctx, groupId, inviteePersonId)) unavailable();
  const existing = await ctx.db
    .query('groupInvites')
    .withIndex('by_groupId_and_inviteeId', q =>
      q.eq('groupId', groupId).eq('inviteeId', inviteePersonId)
    )
    .order('desc')
    .first();
  if (existing?.status === 'PENDING')
    return { inviteId: existing._id, status: 'PENDING' as const };
  const inviteId = await ctx.db.insert('groupInvites', {
    groupId,
    inviterId: actorId,
    inviteeId: inviteePersonId,
    status: 'PENDING',
    createdAt: Date.now(),
  });
  await createNotification(
    ctx,
    {
      personId: inviteePersonId,
      authorId: actorId,
      type: 'GROUP_INVITE_RECEIVED',
      groupId,
      groupInviteId: inviteId,
    },
    {
      messageContext: {
        groupTitle: group.name,
        authorName: (await requirePerson(ctx, actorId)).user.name,
        notificationUrl: `${process.env.SITE_URL || 'https://groupi.gg'}/g/${group._id}`,
      },
    }
  );
  return { inviteId, status: 'PENDING' as const };
}
async function recipientInvite(
  ctx: ReadCtx,
  actorId: Id<'persons'>,
  inviteId: Id<'groupInvites'>
) {
  await requirePerson(ctx, actorId);
  const invite = await ctx.db.get(inviteId);
  if (!invite) fail('NOT_FOUND', 'Group invitation not found.');
  if (invite.inviteeId !== actorId)
    fail('FORBIDDEN', 'Only the invitation recipient can respond.');
  return invite;
}
export async function accept(
  ctx: MutationCtx,
  actorId: Id<'persons'>,
  inviteId: Id<'groupInvites'>
) {
  const invite = await recipientInvite(ctx, actorId, inviteId);
  const existing = await membership(ctx, invite.groupId, actorId);
  if (invite.status === 'ACCEPTED' && existing)
    return {
      groupId: invite.groupId,
      membershipId: existing._id,
      status: 'ACCEPTED' as const,
    };
  if (invite.status !== 'PENDING')
    fail('CONFLICT', 'This invitation has already been resolved.');
  if (!(await canAccept(ctx, invite))) unavailable();
  const group = await ctx.db.get(invite.groupId);
  if (!group) unavailable();
  const membershipId =
    existing?._id ??
    (await ctx.db.insert('groupMemberships', {
      groupId: invite.groupId,
      personId: actorId,
      role: 'MEMBER',
      joinedAt: Date.now(),
    }));
  if (!existing)
    await ctx.db.patch(group._id, {
      memberCount: group.memberCount + 1,
      updatedAt: Date.now(),
    });
  await ctx.db.patch(inviteId, { status: 'ACCEPTED', respondedAt: Date.now() });
  await createNotification(
    ctx,
    {
      personId: invite.inviterId,
      authorId: actorId,
      type: 'GROUP_INVITE_ACCEPTED',
      groupId: invite.groupId,
      groupInviteId: inviteId,
    },
    {
      messageContext: {
        groupTitle: group.name,
        authorName: (await requirePerson(ctx, actorId)).user.name,
        notificationUrl: `${process.env.SITE_URL || 'https://groupi.gg'}/g/${group._id}`,
      },
    }
  );
  return { groupId: invite.groupId, membershipId, status: 'ACCEPTED' as const };
}
export async function decline(
  ctx: MutationCtx,
  actorId: Id<'persons'>,
  inviteId: Id<'groupInvites'>
) {
  const invite = await recipientInvite(ctx, actorId, inviteId);
  if (invite.status === 'DECLINED') return { status: 'DECLINED' as const };
  if (invite.status !== 'PENDING')
    fail('CONFLICT', 'This invitation has already been resolved.');
  await ctx.db.patch(inviteId, { status: 'DECLINED', respondedAt: Date.now() });
  return { status: 'DECLINED' as const };
}
export async function cancel(
  ctx: MutationCtx,
  actorId: Id<'persons'>,
  inviteId: Id<'groupInvites'>
) {
  const invite = await ctx.db.get(inviteId);
  if (!invite) fail('NOT_FOUND', 'Group invitation not found.');
  await requireManager(ctx, invite.groupId, actorId);
  if (invite.status === 'CANCELLED') return { status: 'CANCELLED' as const };
  if (invite.status !== 'PENDING')
    fail('CONFLICT', 'This invitation has already been resolved.');
  await ctx.db.patch(inviteId, {
    status: 'CANCELLED',
    respondedAt: Date.now(),
  });
  return { status: 'CANCELLED' as const };
}
async function profile(ctx: ReadCtx, personId: Id<'persons'>) {
  const identity = await livePerson(ctx, personId);
  return {
    personId,
    name: identity?.user.name ?? null,
    username: identity?.user.username ?? null,
    image: identity?.user.image ?? null,
  };
}
async function project(ctx: ReadCtx, invite: Doc<'groupInvites'>) {
  const group = await ctx.db.get(invite.groupId);
  if (!group) return null;
  return {
    inviteId: invite._id,
    status: invite.status,
    createdAt: invite.createdAt,
    respondedAt: invite.respondedAt ?? null,
    group: {
      groupId: group._id,
      name: group.name,
      description: group.description ?? null,
      image: group.image ?? null,
    },
    inviter: await profile(ctx, invite.inviterId),
    invitee: await profile(ctx, invite.inviteeId),
    available: invite.status === 'PENDING' && (await canAccept(ctx, invite)),
  };
}
function validatePage(options: { numItems: number; cursor: string | null }) {
  if (
    !Number.isInteger(options.numItems) ||
    options.numItems < 1 ||
    options.numItems > 100
  )
    fail('VALIDATION_ERROR', 'Page size must be an integer from 1 to 100.');
}
export async function listInvites(
  ctx: ReadCtx,
  actorId: Id<'persons'>,
  paginationOpts: { numItems: number; cursor: string | null },
  groupId?: Id<'groups'>,
  status?: Doc<'groupInvites'>['status']
) {
  await requirePerson(ctx, actorId);
  validatePage(paginationOpts);
  if (groupId) await requireManager(ctx, groupId, actorId);
  const query = ctx.db.query('groupInvites');
  const rows = groupId
    ? status
      ? query.withIndex('by_groupId_and_status', q =>
          q.eq('groupId', groupId).eq('status', status)
        )
      : query.withIndex('by_groupId', q => q.eq('groupId', groupId))
    : status
      ? query.withIndex('by_inviteeId_and_status', q =>
          q.eq('inviteeId', actorId).eq('status', status)
        )
      : query.withIndex('by_inviteeId', q => q.eq('inviteeId', actorId));
  let result;
  try {
    result = await rows.order('desc').paginate(paginationOpts);
  } catch {
    fail('VALIDATION_ERROR', 'Invalid invitation cursor.');
  }
  const projected = await Promise.all(
    result.page.map(invite => project(ctx, invite))
  );
  return {
    page: projected.filter(value => value !== null),
    isDone: result.isDone,
    continueCursor: result.continueCursor,
  };
}
export async function ownForGroup(
  ctx: ReadCtx,
  actorId: Id<'persons'>,
  groupId: Id<'groups'>
) {
  await requirePerson(ctx, actorId);
  const invite = await ctx.db
    .query('groupInvites')
    .withIndex('by_groupId_and_inviteeId', q =>
      q.eq('groupId', groupId).eq('inviteeId', actorId)
    )
    .order('desc')
    .first();
  return invite ? project(ctx, invite) : null;
}
export async function roster(
  ctx: ReadCtx,
  actorId: Id<'persons'>,
  groupId: Id<'groups'>,
  paginationOpts: { numItems: number; cursor: string | null }
) {
  await requirePerson(ctx, actorId);
  validatePage(paginationOpts);
  if (!(await membership(ctx, groupId, actorId)))
    fail('FORBIDDEN', 'Group membership is required to view members.');
  let result;
  try {
    result = await ctx.db
      .query('groupMemberships')
      .withIndex('by_groupId', q => q.eq('groupId', groupId))
      .paginate(paginationOpts);
  } catch {
    fail('VALIDATION_ERROR', 'Invalid member cursor.');
  }
  return {
    page: await Promise.all(
      result.page.map(async m => ({
        ...(await profile(ctx, m.personId)),
        role: m.role,
        joinedAt: m.joinedAt,
      }))
    ),
    isDone: result.isDone,
    continueCursor: result.continueCursor,
  };
}
export async function policy(
  ctx: MutationCtx,
  actorId: Id<'persons'>,
  groupId: Id<'groups'>,
  invitationsEnabled: boolean
) {
  await requireOwner(ctx, groupId, actorId);
  await ctx.db.patch(groupId, { invitationsEnabled, updatedAt: Date.now() });
  return null;
}
