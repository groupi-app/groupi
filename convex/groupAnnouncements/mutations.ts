import { mutation, internalMutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { input, result } from './contracts';
import { send, process } from './model';
export const sendAnnouncement = mutation({
  args: input,
  returns: result,
  handler: async (ctx, args) =>
    send(ctx, (await requireAuth(ctx)).person._id, args),
});
export const processPage = internalMutation({
  args: { announcementId: v.id('groupAnnouncements') },
  returns: v.null(),
  handler: (ctx, args) => process(ctx, args.announcementId),
});
