import { internalMutation } from '../_generated/server';
import { v } from 'convex/values';
import { makeFunctionReference } from 'convex/server';
import {
  requiredNotificationKey,
  needsCurrentOnboarding,
} from './notificationJobs';
import { livePerson } from '../groups/model';
import { membershipFor, isGroupBanned } from '../groups/policy';
import {
  createNotification,
  collectEmailData,
  collectWebhookData,
  isPersonInDndMode,
} from '../lib/notifications';
export const deliverRequiredChanges = internalMutation({
  args: { jobId: v.id('groupOnboardingJobs') },
  returns: v.null(),
  handler: async (ctx, { jobId }) => {
    const job = await ctx.db.get(jobId);
    if (!job) return null;
    const [group, actor, member, config, actorBanned] = await Promise.all([
      ctx.db.get(job.groupId),
      livePerson(ctx, job.actorId),
      membershipFor(ctx, job.groupId, job.actorId),
      ctx.db
        .query('groupQuestionnaires')
        .withIndex('by_groupId', q => q.eq('groupId', job.groupId))
        .unique(),
      isGroupBanned(ctx, job.groupId, job.actorId),
    ]);
    if (
      !group ||
      !actor ||
      actorBanned ||
      member?.role !== 'OWNER' ||
      group.ownerId !== job.actorId ||
      requiredNotificationKey(config) !== job.semanticKey
    ) {
      await ctx.db.delete(jobId);
      return null;
    }
    const page = await ctx.db
      .query('groupMemberships')
      .withIndex('by_groupId', q => q.eq('groupId', job.groupId))
      .paginate({ numItems: 20, cursor: job.cursor });
    for (const recipient of page.page) {
      if (!(await needsCurrentOnboarding(ctx, job.groupId, recipient.personId)))
        continue;
      await createNotification(
        ctx,
        {
          personId: recipient.personId,
          type: 'GROUP_ONBOARDING_REQUIRED',
          authorId: job.actorId,
          groupId: job.groupId,
        },
        {
          messageContext: {
            groupTitle: group.name,
            notificationUrl: `${process.env.SITE_URL || 'https://groupi.gg'}/groups/${job.groupId}/questionnaire`,
          },
        }
      );
    }
    if (page.isDone) await ctx.db.delete(jobId);
    else {
      await ctx.db.patch(jobId, { cursor: page.continueCursor });
      await ctx.scheduler.runAfter(
        0,
        makeFunctionReference<'mutation', { jobId: typeof jobId }, null>(
          'groupQuestionnaires/notifications:deliverRequiredChanges'
        ),
        { jobId }
      );
    }
    return null;
  },
});
export const resolveExternal = internalMutation({
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
    const dispatch = await ctx.db
      .query('groupOnboardingDispatches')
      .withIndex('by_notificationId', q =>
        q.eq('notificationId', notificationId)
      )
      .unique();
    if (
      !notification ||
      notification.type !== 'GROUP_ONBOARDING_REQUIRED' ||
      !notification.groupId ||
      !dispatch ||
      dispatch.claimedAt !== undefined ||
      !(await needsCurrentOnboarding(
        ctx,
        notification.groupId,
        notification.personId
      )) ||
      (await isPersonInDndMode(ctx, notification.personId))
    )
      return empty;
    const group = await ctx.db.get(notification.groupId);
    if (!group) return empty;
    await ctx.db.patch(dispatch._id, { claimedAt: Date.now() });
    const context = {
      groupTitle: group.name,
      notificationUrl: `${process.env.SITE_URL || 'https://groupi.gg'}/groups/${group._id}/questionnaire`,
    };
    const data = {
      ...notification,
      type: 'GROUP_ONBOARDING_REQUIRED' as const,
    };
    const [emails, webhooks] = await Promise.all([
      collectEmailData(ctx, data, context),
      collectWebhookData(ctx, data, context),
    ]);
    return { emails, webhooks };
  },
});
