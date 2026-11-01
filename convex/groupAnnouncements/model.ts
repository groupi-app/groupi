import { rejectAnnouncementSend } from './retirement';
import type { Id, Doc } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { internal } from '../_generated/api';
import { requireManager } from '../groups/policy';
import { canAccessGroupMemberContent } from '../groups/contentAccess';
import { checkIsBlocked } from '../lib/privacy';
import { isPersonInDndMode } from '../lib/notifications';
export const summary = (row: Doc<'groupAnnouncements'>) => ({
  announcementId: row._id,
  state: row.state,
  notified: row.notified,
  skipped: row.skipped,
});
/** Announcement recipients require this Group content grant; manager recovery remains separate. */
export async function eligible(
  ctx: QueryCtx | MutationCtx,
  groupId: Id<'groups'>,
  senderId: Id<'persons'>,
  personId: Id<'persons'>
) {
  return (
    personId !== senderId &&
    (await canAccessGroupMemberContent(ctx, groupId, personId)) &&
    !(await checkIsBlocked(ctx, senderId, personId)) &&
    !(await isPersonInDndMode(ctx, personId))
  );
}
/** Recheck announcement state, current manager authority and recipient content access at delivery. */
export async function canDeliverAnnouncement(
  ctx: QueryCtx | MutationCtx,
  announcementId: Id<'groupAnnouncements'>,
  personId: Id<'persons'>
) {
  const announcement = await ctx.db.get(announcementId);
  if (!announcement?.senderId || announcement.state === 'CANCELLED')
    return false;
  try {
    await requireManager(ctx, announcement.groupId, announcement.senderId);
    return await eligible(
      ctx,
      announcement.groupId,
      announcement.senderId,
      personId
    );
  } catch {
    return false;
  }
}
/** Retained callable signature rejects new sends and replay-triggered dispatch. */
export async function send(
  ctx: MutationCtx,
  senderId: Id<'persons'>,
  args: {
    groupId: Id<'groups'>;
    requestId: string;
    title: string;
    message: string;
  }
): Promise<ReturnType<typeof summary>> {
  await requireManager(ctx, args.groupId, senderId);
  return rejectAnnouncementSend();
}
export async function get(
  ctx: QueryCtx | MutationCtx,
  senderId: Id<'persons'>,
  groupId: Id<'groups'>,
  requestId: string
) {
  await requireManager(ctx, groupId, senderId);
  const row = await ctx.db
    .query('groupAnnouncements')
    .withIndex('by_groupId_and_senderId_and_requestId', q =>
      q
        .eq('groupId', groupId)
        .eq('senderId', senderId)
        .eq('requestId', requestId)
    )
    .unique();
  return row ? summary(row) : null;
}
export async function process(
  ctx: MutationCtx,
  announcementId: Id<'groupAnnouncements'>
) {
  const row = await ctx.db.get(announcementId);
  if (!row || row.state !== 'PROCESSING') return null;
  if (!row.senderId) {
    await ctx.db.patch(row._id, { state: 'CANCELLED', updatedAt: Date.now() });
    return null;
  }
  try {
    await requireManager(ctx, row.groupId, row.senderId);
  } catch {
    await ctx.db.patch(row._id, { state: 'CANCELLED', updatedAt: Date.now() });
    return null;
  }
  const members = await ctx.db
    .query('groupMemberships')
    .withIndex('by_groupId', q =>
      q.eq('groupId', row.groupId).lte('_creationTime', row.cutoff)
    )
    .paginate({ numItems: 25, cursor: row.cursor });
  let notified = row.notified,
    skipped = row.skipped;
  for (const member of members.page) {
    if (!(await eligible(ctx, row.groupId, row.senderId, member.personId))) {
      skipped++;
      continue;
    }
    const notificationId = await ctx.db.insert('notifications', {
      personId: member.personId,
      authorId: row.senderId,
      groupId: row.groupId,
      groupAnnouncementId: row._id,
      type: 'GROUP_ANNOUNCEMENT',
      read: false,
      updatedAt: Date.now(),
    });
    // Persist only identifiers in scheduled arguments. Resolve private destinations at dispatch.
    await ctx.scheduler.runAfter(
      0,
      internal.groupAnnouncements.actions.dispatch,
      { notificationId }
    );
    notified++;
  }
  await ctx.db.patch(row._id, {
    notified,
    skipped,
    cursor: members.continueCursor,
    state: members.isDone ? 'COMPLETED' : 'PROCESSING',
    updatedAt: Date.now(),
  });
  if (!members.isDone)
    await ctx.scheduler.runAfter(
      0,
      internal.groupAnnouncements.mutations.processPage,
      { announcementId }
    );
  return null;
}
