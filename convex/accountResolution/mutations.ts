import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { deleteOwnedEventForPerson } from './model';
export const deleteOwnedEvent = mutation({
  args: { eventId: v.id('events') },
  returns: v.null(),
  handler: async (ctx, args) =>
    deleteOwnedEventForPerson(
      ctx,
      (await requireAuth(ctx)).person._id,
      args.eventId
    ),
});
