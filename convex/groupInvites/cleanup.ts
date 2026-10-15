import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
async function removeNotification(
  ctx: MutationCtx,
  notificationId: Id<'notifications'>
) {
  for await (const delivery of ctx.db
    .query('pushDeliveries')
    .withIndex('by_notification', q => q.eq('notificationId', notificationId)))
    await ctx.db.delete(delivery._id);
  await ctx.db.delete(notificationId);
}
async function removeInvite(ctx: MutationCtx, inviteId: Id<'groupInvites'>) {
  for await (const notification of ctx.db
    .query('notifications')
    .withIndex('by_groupInviteId', q => q.eq('groupInviteId', inviteId)))
    await removeNotification(ctx, notification._id);
  await ctx.db.delete(inviteId);
}
export async function removeInvitationsForGroup(
  ctx: MutationCtx,
  groupId: Id<'groups'>
) {
  for await (const invite of ctx.db
    .query('groupInvites')
    .withIndex('by_groupId', q => q.eq('groupId', groupId)))
    await removeInvite(ctx, invite._id);
  for await (const notification of ctx.db
    .query('notifications')
    .withIndex('by_groupId', q => q.eq('groupId', groupId)))
    await removeNotification(ctx, notification._id);
}
export async function removeInvitationsForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>
) {
  for await (const invite of ctx.db
    .query('groupInvites')
    .withIndex('by_inviteeId', q => q.eq('inviteeId', personId)))
    await removeInvite(ctx, invite._id);
  for await (const invite of ctx.db
    .query('groupInvites')
    .withIndex('by_inviterId', q => q.eq('inviterId', personId)))
    await removeInvite(ctx, invite._id);
}
