import { internalQuery, internalMutation } from '../../../_generated/server';
import { v } from 'convex/values';
import { Id } from '../../../_generated/dataModel';
import { authComponent, AuthUserId } from '../../../auth';

/**
 * Internal queries and mutations for notification routes
 */

export const listNotifications = internalQuery({
  args: {
    personId: v.string(),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, { personId, unreadOnly }) => {
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_person', q => q.eq('personId', personId as Id<'persons'>))
      .order('desc')
      .collect();

    const filtered = unreadOnly
      ? notifications.filter(n => !n.read)
      : notifications;

    // Enrich notifications with related data
    const enriched = await Promise.all(
      filtered.map(async notification => {
        // Get event if exists
        let event = null;
        if (notification.eventId) {
          const eventDoc = await ctx.db.get(notification.eventId);
          if (eventDoc) {
            event = { id: eventDoc._id, title: eventDoc.title };
          }
        }

        // Get post if exists
        let post = null;
        if (notification.postId) {
          const postDoc = await ctx.db.get(notification.postId);
          if (postDoc) {
            post = { id: postDoc._id, title: postDoc.title };
          }
        }

        // Get author if exists
        let author = null;
        if (notification.authorId) {
          const authorPerson = await ctx.db.get(notification.authorId);
          if (authorPerson) {
            const authorUser = await authComponent.getAnyUserById(
              ctx,
              authorPerson.userId as AuthUserId
            );
            author = {
              id: authorPerson._id,
              userId: authorPerson.userId,
              user: authorUser
                ? {
                    name: authorUser.name || null,
                    email: authorUser.email,
                  }
                : {
                    name: null,
                    email: null,
                  },
            };
          }
        }

        return {
          id: notification._id,
          personId: notification.personId,
          type: notification.type,
          read: notification.read,
          createdAt: notification._creationTime,
          event,
          post,
          author,
        };
      })
    );

    return enriched;
  },
});

export const getUnreadCount = internalQuery({
  args: {
    personId: v.string(),
  },
  handler: async (ctx, { personId }) => {
    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_person', q => q.eq('personId', personId as Id<'persons'>))
      .filter(q => q.eq(q.field('read'), false))
      .collect();

    return { count: unread.length };
  },
});

export const markAsRead = internalMutation({
  args: {
    notificationId: v.string(),
    personId: v.string(),
  },
  handler: async (ctx, { notificationId, personId }) => {
    const notification = await ctx.db.get(
      notificationId as Id<'notifications'>
    );
    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.personId !== (personId as Id<'persons'>)) {
      throw new Error('Not authorized to modify this notification');
    }

    await ctx.db.patch(notificationId as Id<'notifications'>, {
      read: true,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const markAsUnread = internalMutation({
  args: {
    notificationId: v.string(),
    personId: v.string(),
  },
  handler: async (ctx, { notificationId, personId }) => {
    const notification = await ctx.db.get(
      notificationId as Id<'notifications'>
    );
    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.personId !== (personId as Id<'persons'>)) {
      throw new Error('Not authorized to modify this notification');
    }

    await ctx.db.patch(notificationId as Id<'notifications'>, {
      read: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const markAllAsRead = internalMutation({
  args: {
    personId: v.string(),
  },
  handler: async (ctx, { personId }) => {
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_person', q => q.eq('personId', personId as Id<'persons'>))
      .filter(q => q.eq(q.field('read'), false))
      .collect();

    const now = Date.now();
    for (const notification of notifications) {
      await ctx.db.patch(notification._id, { read: true, updatedAt: now });
    }

    return { count: notifications.length };
  },
});

export const deleteNotification = internalMutation({
  args: {
    notificationId: v.string(),
    personId: v.string(),
  },
  handler: async (ctx, { notificationId, personId }) => {
    const notification = await ctx.db.get(
      notificationId as Id<'notifications'>
    );
    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.personId !== (personId as Id<'persons'>)) {
      throw new Error('Not authorized to delete this notification');
    }

    await ctx.db.delete(notificationId as Id<'notifications'>);

    return { success: true };
  },
});

export const deleteAllNotifications = internalMutation({
  args: {
    personId: v.string(),
  },
  handler: async (ctx, { personId }) => {
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_person', q => q.eq('personId', personId as Id<'persons'>))
      .collect();

    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    return { count: notifications.length };
  },
});
