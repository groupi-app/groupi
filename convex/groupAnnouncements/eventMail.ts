import {
  isEventExcludedForPerson,
  isGroupExcludedForPerson,
} from '../groups/exclusions';
import { v, type Infer } from 'convex/values';
import { mutation, query, internalMutation } from '../_generated/server';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import { internal } from '../_generated/api';
import { requireAuth } from '../auth';
import { isAdminRole } from '../lib/constants';
import { requireManager } from '../groups/policy';
import { canAccessGroupMemberContent } from '../groups/contentAccess';
import { preferenceFor } from '../groups/announcementPreferenceModel';
import { eventAdmissionAccess } from '../events/admission';
import { isEventComplete } from '../events/lifecycle';
import { checkIsBlocked } from '../lib/privacy';
import { collectEmailData, isPersonInDndMode } from '../lib/notifications';
import { secretHash, denied } from '../authorization/model';
import {
  receiptBinding,
  priorReceipt,
  saveReceipt,
  operationError,
} from '../groups/operationReceipts';
type Ctx = QueryCtx | MutationCtx;
const escape = (text: string) =>
  text.replace(
    /[&<>"']/g,
    c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!
  );
/** Brand linkage is operator approved independently from staff Event authority. */
async function brand(ctx: Ctx, groupId: Id<'groups'>) {
  const config = await ctx.db
    .query('groupAnnouncementBrands')
    .withIndex('by_groupId', q => q.eq('groupId', groupId))
    .unique();
  if (!config) return null;
  const app = await ctx.db.get(config.appId);
  if (app?.status !== 'approved' || !app.appearance) throw denied();
  const url = new URL(config.returnUrl);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.hash ||
    !app.redirectUris.some(uri => new URL(uri).origin === url.origin)
  )
    throw denied();
  return { app, config };
}
async function brandBinding(ctx: Ctx, groupId: Id<'groups'>) {
  const current = await brand(ctx, groupId);
  return secretHash(
    JSON.stringify(
      current
        ? {
            appId: current.app._id,
            appearance: current.app.appearance,
            url: current.config.returnUrl,
          }
        : null
    )
  );
}
export const configureBrand = mutation({
  args: {
    groupId: v.id('groups'),
    appId: v.id('delegatedApps'),
    returnUrl: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!isAdminRole((await requireAuth(ctx)).user.role)) throw denied();
    if (!(await ctx.db.get(args.groupId))) throw denied();
    const app = await ctx.db.get(args.appId);
    let url: URL;
    try {
      url = new URL(args.returnUrl);
    } catch {
      operationError('VALIDATION_ERROR', 'Trusted HTTPS return URL required.');
    }
    if (
      app?.status !== 'approved' ||
      !app.appearance ||
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.hash ||
      !app.redirectUris.some(uri => new URL(uri).origin === url.origin)
    )
      operationError(
        'VALIDATION_ERROR',
        'Return URL must use an approved app redirect origin.'
      );
    const old = await ctx.db
      .query('groupAnnouncementBrands')
      .withIndex('by_groupId', q => q.eq('groupId', args.groupId))
      .unique();
    if (old) await ctx.db.patch(old._id, args);
    else await ctx.db.insert('groupAnnouncementBrands', args);
    return null;
  },
});
async function authority(
  ctx: Ctx,
  groupId: Id<'groups'>,
  eventId: Id<'events'>,
  senderId: Id<'persons'>,
  active = true
) {
  await requireManager(ctx, groupId, senderId);
  if (
    (await isGroupExcludedForPerson(ctx, groupId, senderId)) ||
    (await isEventExcludedForPerson(ctx, eventId, senderId))
  )
    throw denied();
  const event = await ctx.db.get(eventId);
  const member = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', senderId).eq('eventId', eventId)
    )
    .unique();
  const link = await ctx.db
    .query('groupEventAudiences')
    .withIndex('by_groupId_and_eventId', q =>
      q.eq('groupId', groupId).eq('eventId', eventId)
    )
    .unique();
  if (
    !event ||
    !link ||
    member?.role !== 'ORGANIZER' ||
    (active && isEventComplete(event, Date.now()))
  )
    throw denied();
  return event;
}
async function eligible(
  ctx: Ctx,
  row: Doc<'groupEventAnnouncements'>,
  personId: Id<'persons'>
) {
  if (
    (await isGroupExcludedForPerson(ctx, row.groupId, personId)) ||
    (await isEventExcludedForPerson(ctx, row.eventId, personId))
  )
    return false;
  const preference = await ctx.db
    .query('groupAnnouncementPreferences')
    .withIndex('by_groupId_and_personId', q =>
      q.eq('groupId', row.groupId).eq('personId', personId)
    )
    .unique();
  if (preference?.sourceGrantId) {
    try {
      const { grant } = await liveGrant(
        ctx,
        preference.sourceGrantId,
        Date.now()
      );
      const binding = await ctx.db
        .query('delegatedGrantBindings')
        .withIndex('by_grantId', q => q.eq('grantId', grant._id))
        .unique();
      if (
        !binding?.active ||
        binding.personId !== personId ||
        grant.appId !== preference.sourceAppId ||
        grant.selector.kind !== 'selected-group' ||
        grant.selector.groupId !== row.groupId ||
        !grant.actions.includes('groups.announcements.preferences.update')
      )
        return false;
    } catch {
      return false;
    }
  }
  const event = await ctx.db.get(row.eventId);
  if (
    !event ||
    !(await preferenceFor(ctx, row.groupId, personId)) ||
    !(await canAccessGroupMemberContent(ctx, row.groupId, personId)) ||
    (await checkIsBlocked(ctx, row.senderId, personId)) ||
    (await isPersonInDndMode(ctx, personId))
  )
    return false;
  return (await eventAdmissionAccess(ctx, event, personId))
    .hasApplicationAudience;
}
const receipt = v.object({
  operationId: v.string(),
  outcome: v.literal('committed'),
  result: v.object({ announcementId: v.id('groupEventAnnouncements') }),
  effects: v.object({
    email: v.literal('queued'),
    cleanup: v.literal('not-requested'),
  }),
});
export const announce = mutation({
  args: {
    groupId: v.id('groups'),
    eventId: v.id('events'),
    operationId: v.string(),
  },
  returns: receipt,
  handler: async (ctx, args) => {
    const senderId = (await requireAuth(ctx)).person._id;
    await authority(ctx, args.groupId, args.eventId, senderId);
    const branding = await brandBinding(ctx, args.groupId);
    const binding = await receiptBinding({
      senderId,
      ...args,
      operation: 'announce-event',
      authority: 'native',
    });
    const now = Date.now();
    const prior = await priorReceipt(ctx, args.operationId, binding, now);
    if (prior) return JSON.parse(prior) as Infer<typeof receipt>;
    const last = await ctx.db
      .query('groupMemberships')
      .withIndex('by_groupId', q => q.eq('groupId', args.groupId))
      .order('desc')
      .first();
    const announcementId = await ctx.db.insert('groupEventAnnouncements', {
      groupId: args.groupId,
      eventId: args.eventId,
      senderId,
      brandBinding: branding,
      createdAt: now,
      cursor: null,
      cutoff: last?._creationTime ?? now,
      processed: false,
    });
    await ctx.scheduler.runAfter(
      0,
      internal.groupAnnouncements.eventMail.processPage,
      { announcementId }
    );
    const result = {
      operationId: args.operationId,
      outcome: 'committed' as const,
      result: { announcementId },
      effects: { email: 'queued' as const, cleanup: 'not-requested' as const },
    };
    await saveReceipt(ctx, args.operationId, binding, result, now);
    return result;
  },
});
export const processPage = internalMutation({
  args: { announcementId: v.id('groupEventAnnouncements') },
  returns: v.null(),
  handler: async (ctx, { announcementId }) => {
    const row = await ctx.db.get(announcementId);
    if (!row || row.processed) return null;
    try {
      await authority(ctx, row.groupId, row.eventId, row.senderId);
      if ((await brandBinding(ctx, row.groupId)) !== row.brandBinding)
        throw denied();
    } catch {
      await ctx.db.patch(row._id, { processed: true });
      return null;
    }
    const page = await ctx.db
      .query('groupMemberships')
      .withIndex('by_groupId', q =>
        q.eq('groupId', row.groupId).lte('_creationTime', row.cutoff)
      )
      .paginate({ cursor: row.cursor, numItems: 25 });
    for (const member of page.page)
      if (await eligible(ctx, row, member.personId)) {
        const dispatchId = await ctx.db.insert('groupEventMail', {
          announcementId,
          personId: member.personId,
          state: 'queued',
          attempt: 0,
          delivered: [],
          createdAt: row.createdAt,
        });
        await ctx.scheduler.runAfter(
          0,
          internal.groupAnnouncements.eventMailActions.send,
          { dispatchId }
        );
      }
    await ctx.db.patch(row._id, {
      cursor: page.continueCursor,
      processed: page.isDone,
    });
    if (!page.isDone)
      await ctx.scheduler.runAfter(
        0,
        internal.groupAnnouncements.eventMail.processPage,
        { announcementId }
      );
    return null;
  },
});
export const status = query({
  args: { announcementId: v.id('groupEventAnnouncements') },
  returns: v.object({
    processing: v.boolean(),
    queued: v.number(),
    delivered: v.number(),
    failed: v.number(),
    suppressed: v.number(),
  }),
  handler: async (ctx, { announcementId }) => {
    const row = await ctx.db.get(announcementId);
    if (!row) throw denied();
    await authority(
      ctx,
      row.groupId,
      row.eventId,
      (await requireAuth(ctx)).person._id,
      false
    );
    const counts = {
      processing: !row.processed,
      queued: 0,
      delivered: 0,
      failed: 0,
      suppressed: 0,
    };
    for await (const dispatch of ctx.db
      .query('groupEventMail')
      .withIndex('by_announcementId', q => q.eq('announcementId', row._id)))
      counts[dispatch.state === 'sending' ? 'queued' : dispatch.state]++;
    return counts;
  },
});
const message = v.object({
  from: v.string(),
  to: v.string(),
  subject: v.string(),
  html: v.string(),
  key: v.string(),
});
export const claim = internalMutation({
  args: { dispatchId: v.id('groupEventMail') },
  returns: v.union(
    v.null(),
    v.object({ attempt: v.number(), messages: v.array(message) })
  ),
  handler: async (ctx, { dispatchId }) => {
    const dispatch = await ctx.db.get(dispatchId);
    if (!dispatch || dispatch.state !== 'queued') return null;
    const row = await ctx.db.get(dispatch.announcementId);
    if (Date.now() - dispatch.createdAt >= 23 * 3600000) {
      await ctx.db.patch(dispatchId, { state: 'failed' });
      return null;
    }
    let branding;
    let event;
    try {
      if (!row || !(await eligible(ctx, row, dispatch.personId)))
        throw denied();
      event = await authority(ctx, row.groupId, row.eventId, row.senderId);
      branding = await brand(ctx, row.groupId);
      if ((await brandBinding(ctx, row.groupId)) !== row.brandBinding)
        throw denied();
    } catch {
      await ctx.db.patch(dispatchId, { state: 'suppressed' });
      return null;
    }
    const emails = await collectEmailData(ctx, {
      personId: dispatch.personId,
      type: 'GROUP_ANNOUNCEMENT',
      groupId: row.groupId,
    });
    if (!emails.length) {
      await ctx.db.patch(dispatchId, { state: 'suppressed' });
      return null;
    }
    const appearance = branding?.app.appearance;
    const from =
      process.env.RESEND_FROM_EMAIL || 'Groupi <notifications@groupi.gg>';
    const mailbox = from.match(/<([^<>]+)>$/)?.[1] ?? from;
    const url = `${process.env.SITE_URL || 'https://groupi.gg'}/announcement-preferences/${row.groupId}`;
    const messages =
      dispatch.messages ??
      (await Promise.all(
        emails.map(async email => ({
          from: appearance ? `${appearance.senderName} <${mailbox}>` : from,
          to: email.to,
          subject: event.title,
          html: `<html><body><h1 style="color:${appearance?.accent ?? '#2563eb'}">${escape(appearance?.brandName ?? 'Groupi')}</h1><h2>${escape(event.title)}</h2><p>${escape(event.description ?? '')}</p><p><a href="${escape(url)}">View Event and announcement preferences</a></p><p>Provided by Groupi. Sign in to your own account to continue.</p></body></html>`,
          key: `group-event/${dispatchId}/${await secretHash(email.to)}`,
        }))
      ));
    const pendingMessages = messages.filter(
      m =>
        !dispatch.delivered.includes(m.key) && emails.some(e => e.to === m.to)
    );
    if (!pendingMessages.length && !dispatch.delivered.length) {
      await ctx.db.patch(dispatchId, { state: 'suppressed' });
      return null;
    }
    const attempt = dispatch.attempt + 1;
    await ctx.db.patch(dispatchId, {
      state: 'sending',
      claimedAt: Date.now(),
      attempt,
      messages,
    });
    return {
      attempt,
      messages: pendingMessages,
    };
  },
});
export const finish = internalMutation({
  args: {
    dispatchId: v.id('groupEventMail'),
    attempt: v.number(),
    delivered: v.array(v.string()),
    failed: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.dispatchId);
    if (!row || row.state !== 'sending' || row.attempt !== args.attempt)
      return null;
    await ctx.db.patch(row._id, {
      state: args.failed ? 'failed' : 'delivered',
      delivered: [...new Set([...row.delivered, ...args.delivered])],
    });
    return null;
  },
});
export const retry = mutation({
  args: { announcementId: v.id('groupEventAnnouncements') },
  returns: v.null(),
  handler: async (ctx, { announcementId }) => {
    const row = await ctx.db.get(announcementId);
    if (!row) throw denied();
    await authority(
      ctx,
      row.groupId,
      row.eventId,
      (await requireAuth(ctx)).person._id,
      false
    );
    if (Date.now() - row.createdAt >= 23 * 3600000)
      operationError(
        'CONFLICT',
        'Safe provider retry window expired; inspect provider delivery.'
      );
    for await (const dispatch of ctx.db
      .query('groupEventMail')
      .withIndex('by_announcementId', q =>
        q.eq('announcementId', announcementId)
      )) {
      if (dispatch.state === 'delivered' || dispatch.state === 'suppressed')
        continue;
      if (
        dispatch.state === 'sending' &&
        Date.now() - (dispatch.claimedAt ?? 0) < 300000
      )
        operationError(
          'CONFLICT',
          'Delivery in progress; retry after five minutes.'
        );
      await ctx.db.patch(dispatch._id, { state: 'queued' });
      await ctx.scheduler.runAfter(
        0,
        internal.groupAnnouncements.eventMailActions.send,
        { dispatchId: dispatch._id }
      );
    }
    return null;
  },
});
import { liveGrant } from '../authorization/model';
export const preferenceReturn = query({
  args: { groupId: v.id('groups') },
  returns: v.object({
    groupName: v.string(),
    subscribed: v.boolean(),
    url: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, { groupId }) => {
    const actor = (await requireAuth(ctx)).person._id;
    const group = await ctx.db.get(groupId);
    if (!group) throw denied();
    let branding;
    try {
      branding = await brand(ctx, groupId);
    } catch {
      branding = null;
    }
    let url: string | null = null;
    if (branding && (await canAccessGroupMemberContent(ctx, groupId, actor))) {
      for await (const binding of ctx.db
        .query('delegatedGrantBindings')
        .withIndex('by_personId', q => q.eq('personId', actor))) {
        if (!binding.active || binding.appId !== branding.app._id) continue;
        try {
          const { grant } = await liveGrant(ctx, binding.grantId, Date.now());
          if (
            grant.selector.kind === 'selected-group' &&
            grant.selector.groupId === groupId &&
            grant.actions.includes('groups.context.read')
          ) {
            url = branding.config.returnUrl;
            break;
          }
        } catch {
          continue;
        }
      }
    }
    return {
      groupName: group.name,
      subscribed: await preferenceFor(ctx, groupId, actor),
      url,
    };
  },
});
export const staffEvents = query({
  args: { groupId: v.id('groups') },
  returns: v.array(v.object({ id: v.id('events'), title: v.string() })),
  handler: async (ctx, { groupId }) => {
    const actor = (await requireAuth(ctx)).person._id;
    await requireManager(ctx, groupId, actor);
    const events = [];
    for await (const link of ctx.db
      .query('groupEventAudiences')
      .withIndex('by_groupId', q => q.eq('groupId', groupId)))
      try {
        const event = await authority(ctx, groupId, link.eventId, actor);
        events.push({ id: event._id, title: event.title });
      } catch {
        continue;
      }
    return events;
  },
});
