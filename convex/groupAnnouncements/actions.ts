import { internalAction } from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';
export const dispatch = internalAction({
  args: { notificationId: v.id('notifications') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const data = await ctx.runMutation(
      internal.groupAnnouncements.dispatch.collect,
      args
    );
    if (data.emails.length || data.webhooks.length)
      await ctx.runAction(
        internal.notifications.actions.sendExternalNotifications,
        data
      );
    return null;
  },
});
