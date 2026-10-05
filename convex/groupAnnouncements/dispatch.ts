import { internalMutation } from '../_generated/server';
import { v } from 'convex/values';
import { internal } from '../_generated/api';
import { eligible } from './model';
import { requireManager } from '../groups/policy';
import {
  collectEmailData,
  collectWebhookData,
  collectPushData,
} from '../lib/notifications';
const escape = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
export const collect = internalMutation({
  args: { notificationId: v.id('notifications') },
  returns: v.object({
    emails: v.array(
      v.object({ to: v.string(), subject: v.string(), html: v.string() })
    ),
    webhooks: v.array(
      v.object({
        url: v.string(),
        payload: v.string(),
        headers: v.optional(v.record(v.string(), v.string())),
      })
    ),
  }),
  handler: async (ctx, { notificationId }) => {
    const empty = { emails: [], webhooks: [] };
    const notification = await ctx.db.get(notificationId);
    if (notification?.announcementDispatched) return empty;
    if (
      !notification?.groupAnnouncementId ||
      !notification.authorId ||
      !notification.groupId
    )
      return empty;
    const row = await ctx.db.get(notification.groupAnnouncementId);
    const group = await ctx.db.get(notification.groupId);
    if (!row || !group || !row.senderId || row.state === 'CANCELLED')
      return empty;
    try {
      await requireManager(ctx, row.groupId, row.senderId);
    } catch {
      return empty;
    }
    if (
      !(await eligible(ctx, row.groupId, row.senderId, notification.personId))
    )
      return empty;
    await ctx.db.patch(notificationId, { announcementDispatched: true });
    const context = {
      groupTitle: escape(group.name),
      announcementTitle: escape(row.title),
      announcementMessage: escape(row.message),
      notificationUrl: `${process.env.SITE_URL || 'https://groupi.gg'}/groups/${group._id}`,
    };
    const data = {
      personId: notification.personId,
      type: 'GROUP_ANNOUNCEMENT' as const,
      groupId: group._id,
    };
    const emails = (await collectEmailData(ctx, data, context)).map(email => ({
      ...email,
      subject: row.title,
    }));
    const webhooks = await collectWebhookData(ctx, data, {
      ...context,
      announcementTitle: row.title,
      announcementMessage: row.message,
    });
    const pushes = await collectPushData(ctx, notificationId, data, {
      ...context,
      announcementTitle: row.title,
      announcementMessage: row.message,
    });
    if (pushes.length)
      await ctx.scheduler.runAfter(
        0,
        internal.pushNotifications.actions.sendPushNotifications,
        { deliveryIds: pushes.map(p => p.deliveryId) }
      );
    return { emails, webhooks };
  },
});
