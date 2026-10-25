import { internalMutation, mutation, query } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { makeFunctionReference } from 'convex/server';
import { requireAuth } from '../auth';
import { requireManager, canEnterGroup, membershipFor } from '../groups/policy';
import { liveGrant, secretHash } from '../authorization/model';
import { livePerson } from '../groups/model';
import { collectEmailData, isPersonInDndMode } from '../lib/notifications';
import { decisionEmail } from './decisionEmail';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
async function source(
  ctx: MutationCtx | QueryCtx,
  application: Doc<'groupApplications'>,
  requireRead = false
) {
  if (!application.sourceAppId || !application.sourceGrantId) return null;
  try {
    const { grant } = await liveGrant(
      ctx,
      application.sourceGrantId,
      Date.now()
    );
    const binding = await ctx.db
      .query('delegatedGrantBindings')
      .withIndex('by_grantId', q => q.eq('grantId', grant._id))
      .unique();
    const app = await ctx.db.get(application.sourceAppId);
    if (
      !binding?.active ||
      binding.personId !== application.personId ||
      binding.appId !== app?._id ||
      grant.appId !== app?._id ||
      grant.grantorPersonId !== application.personId ||
      grant.selector.kind !== 'selected-group' ||
      grant.selector.groupId !== application.groupId ||
      (requireRead && !grant.actions.includes('groups.context.read')) ||
      app?.status !== 'approved'
    )
      return null;
    if (app.appearance?.statusReturnUrl) {
      try {
        const destination = new URL(app.appearance.statusReturnUrl);
        if (
          destination.protocol !== 'https:' ||
          destination.username ||
          destination.password ||
          destination.hash ||
          !app.redirectUris.some(uri => {
            try {
              return new URL(uri).origin === destination.origin;
            } catch {
              return false;
            }
          })
        )
          return null;
      } catch {
        return null;
      }
    }
    return app;
  } catch {
    return null;
  }
}
export const statusReturn = query({
  args: { applicationId: v.id('groupApplications') },
  returns: v.object({
    status: v.string(),
    currentMember: v.boolean(),
    url: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, { applicationId }) => {
    const actor = (await requireAuth(ctx)).person._id;
    const application = await ctx.db.get(applicationId);
    if (
      !application ||
      application.personId !== actor ||
      !(await livePerson(ctx, actor))
    )
      throw new ConvexError(
        'Application return unavailable. Use your own account and reconnect if needed.'
      );
    const eligible = await canEnterGroup(ctx, application.groupId, actor);
    const app = eligible ? await source(ctx, application, true) : null;
    return {
      status: application.status,
      currentMember:
        eligible &&
        Boolean(await membershipFor(ctx, application.groupId, actor)),
      url: app?.appearance?.statusReturnUrl ?? null,
    };
  },
});
export const retry = mutation({
  args: { applicationId: v.id('groupApplications') },
  returns: v.null(),
  handler: async (ctx, { applicationId }) => {
    const application = await ctx.db.get(applicationId);
    if (!application) throw new ConvexError('Application unavailable');
    await requireManager(
      ctx,
      application.groupId,
      (await requireAuth(ctx)).person._id
    );
    const dispatch = await ctx.db
      .query('groupDecisionDispatches')
      .withIndex('by_applicationId', q => q.eq('applicationId', applicationId))
      .unique();
    if (
      !dispatch ||
      dispatch.state === 'sent' ||
      dispatch.state === 'suppressed'
    )
      return null;
    if (
      dispatch.state === 'sending' &&
      Date.now() - (dispatch.claimedAt ?? 0) < 300000
    )
      throw new ConvexError(
        'Delivery is still in progress. Retry after five minutes.'
      );
    // Resend only retains idempotency keys for 24h. Never retry an uncertain send beyond that window.
    if (Date.now() - dispatch.createdAt >= 23 * 3600000)
      throw new ConvexError(
        'Safe retry window expired. Inspect provider delivery before contacting applicant.'
      );
    await ctx.db.patch(dispatch._id, { state: 'queued' });
    await ctx.db.patch(applicationId, { decisionDelivery: 'queued' });
    await ctx.scheduler.runAfter(
      0,
      makeFunctionReference<
        'action',
        { applicationId: Id<'groupApplications'> },
        null
      >('groupApplications/decisionActions:send'),
      { applicationId }
    );
    return null;
  },
});
export const claim = internalMutation({
  args: { applicationId: v.id('groupApplications') },
  returns: v.union(
    v.null(),
    v.object({
      dispatchId: v.id('groupDecisionDispatches'),
      attempt: v.number(),
      messages: v.array(
        v.object({
          from: v.string(),
          to: v.string(),
          subject: v.string(),
          html: v.string(),
          key: v.string(),
        })
      ),
    })
  ),
  handler: async (ctx, { applicationId }) => {
    const application = await ctx.db.get(applicationId);
    const dispatch = await ctx.db
      .query('groupDecisionDispatches')
      .withIndex('by_applicationId', q => q.eq('applicationId', applicationId))
      .unique();
    if (!application || !dispatch || dispatch.state !== 'queued') return null;
    if (Date.now() - dispatch.createdAt >= 23 * 3600000) {
      await ctx.db.patch(dispatch._id, { state: 'failed' });
      await ctx.db.patch(applicationId, { decisionDelivery: 'failed' });
      return null;
    }
    const notification = await ctx.db.get(dispatch.notificationId);
    const app = await source(ctx, application);
    const suppressed =
      !notification ||
      (application.status === 'APPROVED' &&
        !(await canEnterGroup(
          ctx,
          application.groupId,
          application.personId
        ))) ||
      !(await livePerson(ctx, application.personId)) ||
      (application.sourceAppId && !app) ||
      (await isPersonInDndMode(ctx, application.personId));
    const emails =
      suppressed || !notification
        ? []
        : await collectEmailData(ctx, {
            ...notification,
            type:
              application.status === 'APPROVED'
                ? 'GROUP_APPLICATION_APPROVED'
                : 'GROUP_APPLICATION_DECLINED',
          });
    if (!emails.length) {
      await ctx.db.patch(dispatch._id, { state: 'suppressed' });
      await ctx.db.patch(applicationId, { decisionDelivery: 'suppressed' });
      return null;
    }
    const from =
      process.env.RESEND_FROM_EMAIL || 'Groupi <notifications@groupi.gg>';
    const url = `${process.env.SITE_URL || 'https://groupi.gg'}/application-status/${applicationId}`;
    const content = decisionEmail(
      app?.appearance,
      application.status,
      url,
      from
    );
    const messages =
      dispatch.messages ??
      (await Promise.all(
        emails.map(async email => ({
          ...content,
          to: email.to,
          key: `group-decision/${dispatch._id}/${await secretHash(email.to)}`,
        }))
      ));
    const attempt = dispatch.attempt + 1;
    await ctx.db.patch(dispatch._id, {
      state: 'sending',
      claimedAt: Date.now(),
      attempt,
      messages,
    });
    await ctx.db.patch(applicationId, { decisionDelivery: 'sending' });
    return {
      dispatchId: dispatch._id,
      attempt,
      messages: messages.filter(
        message =>
          !dispatch.delivered.includes(message.key) &&
          emails.some(email => email.to === message.to)
      ),
    };
  },
});
export const finish = internalMutation({
  args: {
    dispatchId: v.id('groupDecisionDispatches'),
    attempt: v.number(),
    delivered: v.array(v.string()),
    failed: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const dispatch = await ctx.db.get(args.dispatchId);
    if (
      !dispatch ||
      dispatch.attempt !== args.attempt ||
      dispatch.state !== 'sending'
    )
      return null;
    const state = args.failed ? 'failed' : 'sent';
    await ctx.db.patch(dispatch._id, {
      state,
      delivered: [...new Set([...dispatch.delivered, ...args.delivered])],
    });
    if (await ctx.db.get(dispatch.applicationId))
      await ctx.db.patch(dispatch.applicationId, { decisionDelivery: state });
    return null;
  },
});
