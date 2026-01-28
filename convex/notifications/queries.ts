import { query } from '../_generated/server';
import { v } from 'convex/values';
import { getCurrentPerson, authComponent, AuthUserId } from '../auth';

/**
 * Notifications queries for the Convex backend
 *
 * These functions handle notification data retrieval with proper authentication.
 */

/**
 * Get paginated notifications for current user
 */
export const fetchNotificationsForPerson = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { limit = 20 }) => {
    const currentPerson = await getCurrentPerson(ctx);
    if (!currentPerson) {
      return { notifications: [], nextCursor: null };
    }

    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_person', q => q.eq('personId', currentPerson._id))
      .order('desc')
      .take(limit);

    // Enrich notifications with related data
    const enrichedNotifications = await Promise.all(
      notifications.map(async notification => {
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

        // Get author if exists using Better Auth component
        let author = null;
        if (notification.authorId) {
          const authorPerson = await ctx.db.get(notification.authorId);
          if (authorPerson) {
            // Use Better Auth component to look up user data
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
          ...notification,
          id: notification._id,
          createdAt: notification._creationTime,
          event,
          post,
          author,
        };
      })
    );

    return {
      notifications: enrichedNotifications,
      nextCursor:
        notifications.length === limit
          ? notifications[notifications.length - 1]._id
          : null,
    };
  },
});

/**
 * Get unread notification count for current user
 */
export const getUnreadNotificationCount = query({
  args: {
    _traceId: v.optional(v.string()),
  },
  handler: async ctx => {
    const currentPerson = await getCurrentPerson(ctx);
    if (!currentPerson) {
      return { count: 0 };
    }

    const unreadNotifications = await ctx.db
      .query('notifications')
      .withIndex('by_person', q => q.eq('personId', currentPerson._id))
      .filter(q => q.eq(q.field('read'), false))
      .collect();

    return { count: unreadNotifications.length };
  },
});

/**
 * Get user's notification settings
 */
export const fetchUserNotificationSettings = query({
  args: {
    _traceId: v.optional(v.string()),
  },
  handler: async ctx => {
    const currentPerson = await getCurrentPerson(ctx);
    if (!currentPerson) {
      return null;
    }

    // Get person settings
    const personSettings = await ctx.db
      .query('personSettings')
      .withIndex('by_person', q => q.eq('personId', currentPerson._id))
      .first();

    if (!personSettings) {
      // Return default settings if none exist
      return {
        emailNotifications: true,
        pushNotifications: true,
        notificationMethods: [],
      };
    }

    // Get all notification methods for this person
    const notificationMethods = await ctx.db
      .query('notificationMethods')
      .withIndex('by_settings', q => q.eq('settingsId', personSettings._id))
      .collect();

    // Enrich notification methods with their settings
    const enrichedMethods = await Promise.all(
      notificationMethods.map(async method => {
        // Get notification settings for this method
        const methodSettings = await ctx.db
          .query('notificationSettings')
          .withIndex('by_method', q => q.eq('methodId', method._id))
          .collect();

        // Group settings by notification type
        const notifications = methodSettings.map(setting => ({
          notificationType: setting.notificationType,
          enabled: setting.enabled,
        }));

        return {
          id: method._id,
          type: method.type,
          value: method.value,
          enabled: method.enabled,
          name: method.name,
          notifications,
          webhookFormat: method.webhookFormat,
          customTemplate: method.customTemplate,
          webhookHeaders: method.webhookHeaders,
        };
      })
    );

    // Determine overall notification preferences
    const hasEnabledEmailMethod = enrichedMethods.some(
      method => method.type === 'EMAIL' && method.enabled
    );
    const hasEnabledPushMethod = enrichedMethods.some(
      method => method.type === 'PUSH' && method.enabled
    );

    return {
      emailNotifications: hasEnabledEmailMethod,
      pushNotifications: hasEnabledPushMethod,
      notificationMethods: enrichedMethods,
    };
  },
});
