import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
async function remove(ctx: MutationCtx, id: Id<'groupEventAnnouncements'>) {
  for await (const row of ctx.db
    .query('groupEventMail')
    .withIndex('by_announcementId', q => q.eq('announcementId', id)))
    await ctx.db.delete(row._id);
  await ctx.db.delete(id);
}
export async function removeEventMailForGroup(
  ctx: MutationCtx,
  groupId: Id<'groups'>
) {
  for await (const row of ctx.db
    .query('groupEventAnnouncements')
    .withIndex('by_groupId', q => q.eq('groupId', groupId)))
    await remove(ctx, row._id);
  for await (const row of ctx.db
    .query('groupAnnouncementPreferences')
    .withIndex('by_groupId', q => q.eq('groupId', groupId)))
    await ctx.db.delete(row._id);
  for await (const row of ctx.db
    .query('groupAnnouncementBrands')
    .withIndex('by_groupId', q => q.eq('groupId', groupId)))
    await ctx.db.delete(row._id);
}
export async function removeEventMailForEvent(
  ctx: MutationCtx,
  eventId: Id<'events'>
) {
  for await (const row of ctx.db
    .query('groupEventAnnouncements')
    .withIndex('by_eventId', q => q.eq('eventId', eventId)))
    await remove(ctx, row._id);
}
export async function removeEventMailForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>
) {
  for await (const row of ctx.db
    .query('groupEventAnnouncements')
    .withIndex('by_senderId', q => q.eq('senderId', personId)))
    await remove(ctx, row._id);
  for await (const row of ctx.db
    .query('groupEventMail')
    .withIndex('by_personId', q => q.eq('personId', personId)))
    await ctx.db.delete(row._id);
  for await (const row of ctx.db
    .query('groupAnnouncementPreferences')
    .withIndex('by_personId', q => q.eq('personId', personId)))
    await ctx.db.delete(row._id);
}
