import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
async function deletePushDeliveries(
  ctx: MutationCtx,
  notificationIds: Id<'notifications'>[]
) {
  for (const notificationId of notificationIds) {
    const deliveries = await ctx.db
      .query('pushDeliveries')
      .withIndex('by_notification', q => q.eq('notificationId', notificationId))
      .collect();
    await Promise.all(deliveries.map(delivery => ctx.db.delete(delivery._id)));
    for await (const dispatch of ctx.db
      .query('groupOnboardingDispatches')
      .withIndex('by_notificationId', q =>
        q.eq('notificationId', notificationId)
      ))
      await ctx.db.delete(dispatch._id);
  }
}

export async function readNotification(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  notificationId: Id<'notifications'>
) {
  const notification = await ctx.db.get(notificationId);
  if (!notification) {
    throw new Error('Notification not found');
  }

  // Verify ownership
  if (notification.personId !== personId) {
    throw new Error('Not authorized to modify this notification');
  }

  await ctx.db.patch(notificationId, { read: true, updatedAt: Date.now() });
  return { success: true };
}
export async function unreadNotification(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  notificationId: Id<'notifications'>
) {
  const notification = await ctx.db.get(notificationId);
  if (!notification) {
    throw new Error('Notification not found');
  }

  // Verify ownership
  if (notification.personId !== personId) {
    throw new Error('Not authorized to modify this notification');
  }

  await ctx.db.patch(notificationId, { read: false, updatedAt: Date.now() });
  return { success: true };
}
export async function readAllNotifications(
  ctx: MutationCtx,
  personId: Id<'persons'>
) {
  const notifications = await ctx.db
    .query('notifications')
    .withIndex('by_person_read', q =>
      q.eq('personId', personId).eq('read', false)
    )
    .collect();

  for (const notification of notifications) {
    await ctx.db.patch(notification._id, {
      read: true,
      updatedAt: Date.now(),
    });
  }

  return { success: true, count: notifications.length };
}
export async function readEventNotifications(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  eventId: Id<'events'>
) {
  const notifications = await ctx.db
    .query('notifications')
    .withIndex('by_person_read', q =>
      q.eq('personId', personId).eq('read', false)
    )
    .filter(q => q.eq(q.field('eventId'), eventId))
    .collect();

  for (const notification of notifications) {
    await ctx.db.patch(notification._id, {
      read: true,
      updatedAt: Date.now(),
    });
  }

  return { success: true, count: notifications.length };
}
export async function readPostNotifications(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  postId: Id<'posts'>
) {
  const notifications = await ctx.db
    .query('notifications')
    .withIndex('by_person_read', q =>
      q.eq('personId', personId).eq('read', false)
    )
    .filter(q => q.eq(q.field('postId'), postId))
    .collect();

  for (const notification of notifications) {
    await ctx.db.patch(notification._id, {
      read: true,
      updatedAt: Date.now(),
    });
  }

  return { success: true, count: notifications.length };
}
export async function clearNotification(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  notificationId: Id<'notifications'>
) {
  const notification = await ctx.db.get(notificationId);
  if (!notification) {
    throw new Error('Notification not found');
  }

  // Verify ownership
  if (notification.personId !== personId) {
    throw new Error('Not authorized to delete this notification');
  }

  await deletePushDeliveries(ctx, [notificationId]);
  await ctx.db.delete(notificationId);
  return { success: true };
}
export async function clearAllNotifications(
  ctx: MutationCtx,
  personId: Id<'persons'>
) {
  const notifications = await ctx.db
    .query('notifications')
    .withIndex('by_person', q => q.eq('personId', personId))
    .collect();

  await deletePushDeliveries(
    ctx,
    notifications.map(notification => notification._id)
  );
  for (const notification of notifications) {
    await ctx.db.delete(notification._id);
  }

  return { success: true, count: notifications.length };
}
