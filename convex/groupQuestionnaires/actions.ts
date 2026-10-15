'use node';
import { internalAction } from '../_generated/server';
import { v } from 'convex/values';
import { internal } from '../_generated/api';
export const sendExternal = internalAction({
  args: { notificationId: v.id('notifications') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const data = await ctx.runMutation(
      internal.groupQuestionnaires.notifications.resolveExternal,
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
