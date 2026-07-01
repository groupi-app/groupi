import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';
import { internal } from '../_generated/api';

const BATCH_SIZE = 50;

export const backfillMemberCount = internalMutation({
  args: {
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, { cursor }) => {
    const results = await ctx.db
      .query('events')
      .paginate({ cursor: cursor ?? null, numItems: BATCH_SIZE });

    let updated = 0;
    for (const event of results.page) {
      if (event.memberCount !== undefined) continue;

      const memberships = await ctx.db
        .query('memberships')
        .withIndex('by_event', q => q.eq('eventId', event._id))
        .collect();

      await ctx.db.patch(event._id, { memberCount: memberships.length });
      updated++;
    }

    console.log(
      `Backfilled ${updated} events (${results.page.length} scanned)`
    );

    if (!results.isDone) {
      await ctx.scheduler.runAfter(
        0,
        internal.migration.backfillMemberCount.backfillMemberCount,
        { cursor: results.continueCursor }
      );
    }

    return { updated, isDone: results.isDone };
  },
});
