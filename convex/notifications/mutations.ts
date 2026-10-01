import {
  readNotification,
  unreadNotification,
  readAllNotifications,
  readEventNotifications,
  readPostNotifications,
  clearNotification,
  clearAllNotifications,
} from './model';
import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { Doc } from '../_generated/dataModel';

/**
 * Notifications mutations for the Convex backend
 *
 * These functions handle notification state changes with proper authentication.
 */

/**
 * Mark single notification as read
 */
export const markNotificationAsRead = mutation({
  args: {
    notificationId: v.id('notifications'),
    _traceId: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { notificationId }) => {
    const { person } = await requireAuth(ctx);
    return readNotification(ctx, person._id, notificationId);
  },
});

/**
 * Mark single notification as unread
 */
export const markNotificationAsUnread = mutation({
  args: {
    notificationId: v.id('notifications'),
    _traceId: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { notificationId }) => {
    const { person } = await requireAuth(ctx);
    return unreadNotification(ctx, person._id, notificationId);
  },
});

/**
 * Mark all notifications as read for current user
 */
export const markAllNotificationsAsRead = mutation({
  args: {
    _traceId: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean(), count: v.number() }),
  handler: async ctx => {
    const { person } = await requireAuth(ctx);
    return readAllNotifications(ctx, person._id);
  },
});

/**
 * Mark all notifications for a specific event as read
 */
export const markEventNotificationsAsRead = mutation({
  args: {
    eventId: v.id('events'),
    _traceId: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean(), count: v.number() }),
  handler: async (ctx, { eventId }) => {
    const { person } = await requireAuth(ctx);
    return readEventNotifications(ctx, person._id, eventId);
  },
});

/**
 * Mark all notifications for a specific post as read
 */
export const markPostNotificationsAsRead = mutation({
  args: {
    postId: v.id('posts'),
    _traceId: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean(), count: v.number() }),
  handler: async (ctx, { postId }) => {
    const { person } = await requireAuth(ctx);
    return readPostNotifications(ctx, person._id, postId);
  },
});

/**
 * Delete a single notification
 */
export const deleteNotification = mutation({
  args: {
    notificationId: v.id('notifications'),
    _traceId: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { notificationId }) => {
    const { person } = await requireAuth(ctx);
    return clearNotification(ctx, person._id, notificationId);
  },
});

/**
 * Delete all notifications for current user
 */
export const deleteAllNotifications = mutation({
  args: {
    _traceId: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean(), count: v.number() }),
  handler: async ctx => {
    const { person } = await requireAuth(ctx);
    return clearAllNotifications(ctx, person._id);
  },
});

/**
 * Add a new notification method for the current user.
 */
export const addNotificationMethod = mutation({
  args: {
    type: v.union(v.literal('EMAIL'), v.literal('PUSH'), v.literal('WEBHOOK')),
    name: v.optional(v.string()),
    value: v.string(), // email address, webhook URL, etc.
    webhookHeaders: v.optional(v.any()), // JSON object for webhook headers
    customTemplate: v.optional(v.string()),
    webhookFormat: v.optional(
      v.union(
        v.literal('DISCORD'),
        v.literal('SLACK'),
        v.literal('TEAMS'),
        v.literal('GENERIC'),
        v.literal('CUSTOM')
      )
    ),
    _traceId: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { type, name, value, webhookHeaders, customTemplate, webhookFormat }
  ) => {
    const { person } = await requireAuth(ctx);

    // Validate input based on type
    if (type === 'EMAIL' && !value.includes('@')) {
      throw new Error('Invalid email address');
    }

    if (type === 'WEBHOOK' && !value.startsWith('http')) {
      throw new Error('Webhook URL must start with http or https');
    }

    // Get or create person settings
    let personSettings = await ctx.db
      .query('personSettings')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .first();

    const now = Date.now();
    if (!personSettings) {
      const settingsId = await ctx.db.insert('personSettings', {
        personId: person._id,
        updatedAt: now,
      });
      personSettings = await ctx.db.get(settingsId);
      if (!personSettings) {
        throw new Error('Failed to create person settings');
      }
    }

    // Create the notification method
    const methodId = await ctx.db.insert('notificationMethods', {
      settingsId: personSettings._id,
      type,
      enabled: true,
      name,
      value,
      webhookHeaders,
      customTemplate,
      webhookFormat,
      updatedAt: now,
    });

    // Create default notification settings (all enabled)
    const notificationTypes = [
      'EVENT_EDITED',
      'NEW_POST',
      'NEW_REPLY',
      'DATE_CHOSEN',
      'DATE_CHANGED',
      'DATE_RESET',
      'USER_JOINED',
      'USER_LEFT',
      'USER_PROMOTED',
      'USER_DEMOTED',
      'USER_RSVP',
      'USER_MENTIONED',
      'EVENT_REMINDER',
    ] as const;

    await Promise.all(
      notificationTypes.map(async notificationType => {
        await ctx.db.insert('notificationSettings', {
          notificationType,
          methodId,
          enabled: true,
          updatedAt: now,
        });
      })
    );

    return {
      methodId,
      success: true,
    };
  },
});

/**
 * Update an existing notification method.
 */
export const updateNotificationMethod = mutation({
  args: {
    methodId: v.id('notificationMethods'),
    enabled: v.optional(v.boolean()),
    name: v.optional(v.string()),
    value: v.optional(v.string()),
    webhookHeaders: v.optional(v.any()),
    customTemplate: v.optional(v.string()),
    webhookFormat: v.optional(
      v.union(
        v.literal('DISCORD'),
        v.literal('SLACK'),
        v.literal('TEAMS'),
        v.literal('GENERIC'),
        v.literal('CUSTOM')
      )
    ),
    _traceId: v.optional(v.string()),
  },
  handler: async (
    ctx,
    {
      methodId,
      enabled,
      name,
      value,
      webhookHeaders,
      customTemplate,
      webhookFormat,
    }
  ) => {
    const { person } = await requireAuth(ctx);

    // Get the notification method and verify ownership
    const method = await ctx.db.get(methodId);
    if (!method) {
      throw new Error('Notification method not found');
    }

    // Get person settings to verify ownership
    const personSettings = await ctx.db.get(method.settingsId);
    if (!personSettings || personSettings.personId !== person._id) {
      throw new Error('Access denied');
    }

    // Validate email and webhook URLs if provided
    if (value) {
      if (method.type === 'EMAIL' && !value.includes('@')) {
        throw new Error('Invalid email address');
      }

      if (method.type === 'WEBHOOK' && !value.startsWith('http')) {
        throw new Error('Webhook URL must start with http or https');
      }
    }

    // Prepare update data
    const updateData: Partial<Doc<'notificationMethods'>> = {
      updatedAt: Date.now(),
    };
    if (enabled !== undefined) updateData.enabled = enabled;
    if (name !== undefined) updateData.name = name;
    if (value !== undefined) updateData.value = value;
    if (webhookHeaders !== undefined)
      updateData.webhookHeaders = webhookHeaders;
    if (customTemplate !== undefined)
      updateData.customTemplate = customTemplate;
    if (webhookFormat !== undefined) updateData.webhookFormat = webhookFormat;

    // Update the notification method
    await ctx.db.patch(methodId, updateData);

    return {
      methodId,
      success: true,
    };
  },
});

/**
 * Delete a notification method and all its settings.
 */
export const deleteNotificationMethod = mutation({
  args: {
    methodId: v.id('notificationMethods'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { methodId }) => {
    const { person } = await requireAuth(ctx);

    // Get the notification method and verify ownership
    const method = await ctx.db.get(methodId);
    if (!method) {
      throw new Error('Notification method not found');
    }

    // Get person settings to verify ownership
    const personSettings = await ctx.db.get(method.settingsId);
    if (!personSettings || personSettings.personId !== person._id) {
      throw new Error('Access denied');
    }

    // Delete all notification settings for this method
    const notificationSettings = await ctx.db
      .query('notificationSettings')
      .withIndex('by_method', q => q.eq('methodId', methodId))
      .collect();

    await Promise.all(
      notificationSettings.map(async setting => {
        await ctx.db.delete(setting._id);
      })
    );

    // Delete the notification method
    await ctx.db.delete(methodId);

    return {
      methodId,
      success: true,
    };
  },
});

/**
 * Update notification preferences for a specific method and type.
 */
export const updateNotificationSetting = mutation({
  args: {
    methodId: v.id('notificationMethods'),
    notificationType: v.union(
      v.literal('EVENT_EDITED'),
      v.literal('NEW_POST'),
      v.literal('NEW_REPLY'),
      v.literal('DATE_CHOSEN'),
      v.literal('DATE_CHANGED'),
      v.literal('DATE_RESET'),
      v.literal('USER_JOINED'),
      v.literal('USER_LEFT'),
      v.literal('USER_PROMOTED'),
      v.literal('USER_DEMOTED'),
      v.literal('USER_RSVP'),
      v.literal('USER_MENTIONED')
    ),
    enabled: v.boolean(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { methodId, notificationType, enabled }) => {
    const { person } = await requireAuth(ctx);

    // Get the notification method and verify ownership
    const method = await ctx.db.get(methodId);
    if (!method) {
      throw new Error('Notification method not found');
    }

    // Get person settings to verify ownership
    const personSettings = await ctx.db.get(method.settingsId);
    if (!personSettings || personSettings.personId !== person._id) {
      throw new Error('Access denied');
    }

    // Find existing notification setting
    const existingSetting = await ctx.db
      .query('notificationSettings')
      .withIndex('by_type_method', q =>
        q.eq('notificationType', notificationType).eq('methodId', methodId)
      )
      .first();

    if (existingSetting) {
      // Update existing setting
      await ctx.db.patch(existingSetting._id, {
        enabled,
        updatedAt: Date.now(),
      });
    } else {
      // Create new setting
      await ctx.db.insert('notificationSettings', {
        notificationType,
        methodId,
        enabled,
        updatedAt: Date.now(),
      });
    }

    return {
      methodId,
      notificationType,
      enabled,
      success: true,
    };
  },
});
