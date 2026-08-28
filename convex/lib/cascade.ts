import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { dispatchAddonLifecycle } from '../addons/lifecycle';

export async function cascadeDeleteEventData(
  ctx: MutationCtx,
  eventId: Id<'events'>
) {
  const [
    memberships,
    potentialDates,
    posts,
    invites,
    notifications,
    addonConfigs,
    addonDataEntries,
    addonOptOuts,
    reminderOptOuts,
  ] = await Promise.all([
    ctx.db
      .query('memberships')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect(),
    ctx.db
      .query('potentialDateTimes')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect(),
    ctx.db
      .query('posts')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect(),
    ctx.db
      .query('invites')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect(),
    ctx.db
      .query('notifications')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect(),
    ctx.db
      .query('eventAddonConfigs')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect(),
    ctx.db
      .query('addonData')
      .withIndex('by_event_addon', q => q.eq('eventId', eventId))
      .collect(),
    ctx.db
      .query('addonOptOuts')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect(),
    ctx.db
      .query('reminderOptOuts')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect(),
  ]);

  const [availabilitiesByMembership, repliesByPost, deliveriesByNotification] =
    await Promise.all([
      Promise.all(
        memberships.map(m =>
          ctx.db
            .query('availabilities')
            .withIndex('by_membership', q => q.eq('membershipId', m._id))
            .collect()
        )
      ),
      Promise.all(
        posts.map(p =>
          ctx.db
            .query('replies')
            .withIndex('by_post', q => q.eq('postId', p._id))
            .collect()
        )
      ),
      Promise.all(
        notifications.map(notification =>
          ctx.db
            .query('pushDeliveries')
            .withIndex('by_notification', q =>
              q.eq('notificationId', notification._id)
            )
            .collect()
        )
      ),
    ]);

  await dispatchAddonLifecycle(ctx, eventId, 'onEventDeleted');

  for (const avails of availabilitiesByMembership) {
    for (const a of avails) {
      await ctx.db.delete(a._id);
    }
  }

  for (const d of potentialDates) {
    await ctx.db.delete(d._id);
  }

  for (const replies of repliesByPost) {
    for (const r of replies) {
      await ctx.db.delete(r._id);
    }
  }

  for (const p of posts) {
    await ctx.db.delete(p._id);
  }

  for (const i of invites) {
    await ctx.db.delete(i._id);
  }

  for (const deliveries of deliveriesByNotification) {
    for (const delivery of deliveries) {
      await ctx.db.delete(delivery._id);
    }
  }

  for (const n of notifications) {
    await ctx.db.delete(n._id);
  }

  for (const c of addonConfigs) {
    await ctx.db.delete(c._id);
  }

  for (const d of addonDataEntries) {
    await ctx.db.delete(d._id);
  }

  for (const o of addonOptOuts) {
    await ctx.db.delete(o._id);
  }

  for (const o of reminderOptOuts) {
    await ctx.db.delete(o._id);
  }

  for (const m of memberships) {
    await ctx.db.delete(m._id);
  }

  await ctx.db.delete(eventId);
}
