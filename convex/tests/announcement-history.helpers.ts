import type { Id } from '../_generated/dataModel';
import { internal } from '../_generated/api';
import { createTestInstance } from './test_helpers';
import { secretHash } from '../authorization/model';

/** Synthetic historical queue fixture only. Never bypasses retirement in production code. */
export async function seedGroupAnnouncement(
  t: ReturnType<typeof createTestInstance>,
  senderId: Id<'persons'>,
  args: {
    groupId: Id<'groups'>;
    requestId: string;
    title: string;
    message: string;
  },
  schedule = true
) {
  return t.run(async ctx => {
    const existing = await ctx.db
      .query('groupAnnouncements')
      .withIndex('by_groupId_and_senderId_and_requestId', q =>
        q
          .eq('groupId', args.groupId)
          .eq('senderId', senderId)
          .eq('requestId', args.requestId)
      )
      .unique();
    if (existing)
      return {
        announcementId: existing._id,
        state: existing.state,
        notified: existing.notified,
        skipped: existing.skipped,
      };
    const now = Date.now();
    const last = await ctx.db
      .query('groupMemberships')
      .withIndex('by_groupId', q => q.eq('groupId', args.groupId))
      .order('desc')
      .first();
    const announcementId = await ctx.db.insert('groupAnnouncements', {
      ...args,
      senderId,
      state: 'PROCESSING',
      notified: 0,
      skipped: 0,
      cursor: null,
      cutoff: last?._creationTime ?? now,
      createdAt: now,
      updatedAt: now,
    });
    if (schedule)
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
  });
}
export async function seedEventAnnouncement(
  t: ReturnType<typeof createTestInstance>,
  senderId: Id<'persons'>,
  args: { groupId: Id<'groups'>; eventId: Id<'events'>; operationId: string },
  schedule = true
) {
  return t.run(async ctx => {
    const config = await ctx.db
      .query('groupAnnouncementBrands')
      .withIndex('by_groupId', q => q.eq('groupId', args.groupId))
      .unique();
    const app = config ? await ctx.db.get(config.appId) : null;
    const brandBinding = await secretHash(
      JSON.stringify(
        config && app
          ? {
              appId: app._id,
              appearance: app.appearance,
              url: config.returnUrl,
            }
          : null
      )
    );
    const last = await ctx.db
      .query('groupMemberships')
      .withIndex('by_groupId', q => q.eq('groupId', args.groupId))
      .order('desc')
      .first();
    const now = Date.now();
    const announcementId = await ctx.db.insert('groupEventAnnouncements', {
      groupId: args.groupId,
      eventId: args.eventId,
      senderId,
      brandBinding,
      createdAt: now,
      cursor: null,
      cutoff: last?._creationTime ?? now,
      processed: false,
    });
    if (schedule)
      await ctx.scheduler.runAfter(
        0,
        internal.groupAnnouncements.eventMail.processPage,
        { announcementId }
      );
    return {
      operationId: args.operationId,
      outcome: 'committed' as const,
      result: { announcementId },
      effects: { email: 'queued' as const, cleanup: 'not-requested' as const },
    };
  });
}
/** A previously queued internal retry fixture, not a callable send API. */
export async function requeueHistoricalDispatch(
  t: ReturnType<typeof createTestInstance>,
  dispatchId: Id<'groupEventMail'>
) {
  await t.run(ctx => ctx.db.patch(dispatchId, { state: 'queued' }));
}
