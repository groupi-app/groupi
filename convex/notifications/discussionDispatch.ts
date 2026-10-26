import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';
import { makeFunctionReference } from 'convex/server';
import {
  canDeliverGroupDiscussion,
  notifyGroupDiscussionMembersPage,
  collectEmailData,
  collectWebhookData,
  collectPushData,
} from '../lib/notifications';

/** Scheduled jobs carry only an ID so revoked Group access cannot leak queued content. */
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
    const row = await ctx.db.get(notificationId);
    if (
      !row ||
      row.discussionDispatched ||
      !(await canDeliverGroupDiscussion(ctx, row))
    )
      return empty;
    await ctx.db.patch(row._id, { discussionDispatched: true });
    const emails = await collectEmailData(ctx, row);
    const webhooks = await collectWebhookData(ctx, row);
    const pushes = await collectPushData(ctx, row._id, row);
    if (pushes.length)
      await ctx.scheduler.runAfter(
        0,
        makeFunctionReference<
          'action',
          { deliveryIds: (typeof pushes)[number]['deliveryId'][] },
          { sent: number; failed: number; retrying: number }
        >('pushNotifications/actions:sendPushNotifications'),
        { deliveryIds: pushes.map(push => push.deliveryId) }
      );
    return { emails, webhooks };
  },
});

/** Continuation receives only canonical identifiers and rechecks each recipient's current access. */
export const fanout = internalMutation({
  args: {
    groupId: v.id('groups'),
    postId: v.id('posts'),
    authorId: v.optional(v.id('persons')),
    type: v.literal('NEW_POST'),
    cursor: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { cursor, ...data }) => {
    await notifyGroupDiscussionMembersPage(ctx, data, cursor);
    return null;
  },
});
