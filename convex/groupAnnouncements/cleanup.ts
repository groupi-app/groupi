import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
async function removeNotifications(
  ctx: MutationCtx,
  announcementId: Id<'groupAnnouncements'>
) {
  for await (const notification of ctx.db
    .query('notifications')
    .withIndex('by_groupAnnouncementId', q =>
      q.eq('groupAnnouncementId', announcementId)
    )) {
    for await (const delivery of ctx.db
      .query('pushDeliveries')
      .withIndex('by_notification', q =>
        q.eq('notificationId', notification._id)
      ))
      await ctx.db.delete(delivery._id);
    await ctx.db.delete(notification._id);
  }
}
export async function removeAnnouncementsForGroup(
  ctx: MutationCtx,
  groupId: Id<'groups'>
) {
  for await (const row of ctx.db
    .query('groupAnnouncements')
    .withIndex('by_groupId', q => q.eq('groupId', groupId))) {
    await removeNotifications(ctx, row._id);
    await ctx.db.delete(row._id);
  }
}
export async function removeAnnouncementsForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>
) {
  for await (const notification of ctx.db
    .query('notifications')
    .withIndex('by_person_and_type', q =>
      q.eq('personId', personId).eq('type', 'GROUP_ANNOUNCEMENT')
    )) {
    for await (const delivery of ctx.db
      .query('pushDeliveries')
      .withIndex('by_notification', q =>
        q.eq('notificationId', notification._id)
      ))
      await ctx.db.delete(delivery._id);
    await ctx.db.delete(notification._id);
  }
  // A send request/history is private manager data; purge on sender deletion.
  for await (const row of ctx.db
    .query('groupAnnouncements')
    .withIndex('by_senderId', q => q.eq('senderId', personId))) {
    await removeNotifications(ctx, row._id);
    await ctx.db.delete(row._id);
  }
}
