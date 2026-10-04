import { query } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { result, statusForPerson } from './model';
export const status = query({
  args: { eventId: v.id('events') },
  returns: v.union(result, v.null()),
  handler: async (ctx, { eventId }) => {
    const { person } = await requireAuth(ctx);
    return statusForPerson(ctx, person._id, eventId);
  },
});
