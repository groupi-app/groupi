import { ConvexError } from 'convex/values';
import type { Id, Doc } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { internal } from '../_generated/api';
import { requireManager, membershipFor, isGroupBanned } from '../groups/policy';
import { livePerson } from '../groups/model';
import { checkIsBlocked } from '../lib/privacy';
import { isPersonInDndMode } from '../lib/notifications';
import { requestExpiry } from '../lib/requestId';
export const summary = (row: Doc<'groupAnnouncements'>) => ({
  announcementId: row._id,
  state: row.state,
  notified: row.notified,
  skipped: row.skipped,
});
/** Simple permitted-member seam; onboarding composition belongs to T10. */
export async function eligible(
  ctx: QueryCtx | MutationCtx,
  groupId: Id<'groups'>,
  senderId: Id<'persons'>,
  personId: Id<'persons'>
) {
  return (
    personId !== senderId &&
    Boolean(await membershipFor(ctx, groupId, personId)) &&
    Boolean(await livePerson(ctx, personId)) &&
    !(await isGroupBanned(ctx, groupId, personId)) &&
    !(await checkIsBlocked(ctx, senderId, personId)) &&
    !(await isPersonInDndMode(ctx, personId))
  );
}
export async function send(
  ctx: MutationCtx,
  senderId: Id<'persons'>,
  args: {
    groupId: Id<'groups'>;
    requestId: string;
    title: string;
    message: string;
  }
) {
  await requireManager(ctx, args.groupId, senderId);
  requestExpiry(
    args.requestId,
    'Inspect announcement status before using a new identifier.'
  );
  const title = args.title.trim(),
    message = args.message.trim();
  if (!title || title.length > 100 || !message || message.length > 2000)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message:
        'Announcement title must contain 1–100 characters and message 1–2000 characters.',
    });
  const existing = await ctx.db
    .query('groupAnnouncements')
    .withIndex('by_groupId_and_senderId_and_requestId', q =>
      q
        .eq('groupId', args.groupId)
        .eq('senderId', senderId)
        .eq('requestId', args.requestId)
    )
    .unique();
  if (existing) {
    if (existing.title !== title || existing.message !== message)
      throw new ConvexError({
        code: 'CONFLICT',
        message:
          'Request identifier was already used for different announcement content.',
      });
    if (existing.state === 'PROCESSING')
      await ctx.scheduler.runAfter(
        0,
        internal.groupAnnouncements.mutations.processPage,
        { announcementId: existing._id }
      );
    return summary(existing);
  }
  const now = Date.now();
  const announcementId = await ctx.db.insert('groupAnnouncements', {
    ...args,
    title,
    message,
    senderId,
    state: 'PROCESSING',
    notified: 0,
    skipped: 0,
    cursor: null,
    cutoff:
      (
        await ctx.db
          .query('groupMemberships')
          .withIndex('by_groupId', q => q.eq('groupId', args.groupId))
          .order('desc')
          .first()
      )?._creationTime ?? now,
    createdAt: now,
    updatedAt: now,
  });
  await ctx.scheduler.runAfter(
    0,
    internal.groupAnnouncements.mutations.processPage,
    { announcementId }
  );
  return {
    announcementId,
    state: 'PROCESSING' as const,
    notified: 0,
    skipped: 0,
  };
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
