import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth, getPersonForUser } from '../auth';

// Notification type validator matching schema
const notificationTypeValidator = v.union(
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
);

// Method type validator
const methodTypeValidator = v.union(
  v.literal('EMAIL'),
  v.literal('PUSH'),
  v.literal('WEBHOOK')
);

// Webhook format validator
const webhookFormatValidator = v.union(
  v.literal('DISCORD'),
  v.literal('SLACK'),
  v.literal('TEAMS'),
  v.literal('GENERIC'),
  v.literal('CUSTOM')
);

// Notification setting within a method
const notificationSettingValidator = v.object({
  notificationType: notificationTypeValidator,
  enabled: v.boolean(),
});

// Full notification method validator for updates
const notificationMethodValidator = v.object({
  id: v.optional(v.id('notificationMethods')), // Optional for new methods
  type: methodTypeValidator,
  enabled: v.boolean(),
  name: v.optional(v.string()),
  value: v.string(),
  webhookFormat: v.optional(webhookFormatValidator),
  customTemplate: v.optional(v.string()),
  webhookHeaders: v.optional(v.string()), // JSON string
  notifications: v.array(notificationSettingValidator),
});

/**
 * Save notification settings for the current user
 * This handles creating, updating, and deleting notification methods
 */
export const saveNotificationSettings = mutation({
  args: {
    notificationMethods: v.array(notificationMethodValidator),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { notificationMethods }) => {
    const { user } = await requireAuth(ctx);

    const person = await getPersonForUser(ctx, user._id);
    if (!person) {
      throw new Error('Person not found for user');
    }

    // Get or create person settings
    let personSettings = await ctx.db
      .query('personSettings')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .first();

    if (!personSettings) {
      const settingsId = await ctx.db.insert('personSettings', {
        personId: person._id,
        updatedAt: Date.now(),
      });
      personSettings = await ctx.db.get(settingsId);
      if (!personSettings) {
        throw new Error('Failed to create person settings');
      }
    }

    // Get existing methods to determine what to update/delete
    const existingMethods = await ctx.db
      .query('notificationMethods')
      .withIndex('by_settings', q => q.eq('settingsId', personSettings._id))
      .collect();

    const existingMethodIds = new Set(existingMethods.map(m => m._id));
    const incomingMethodIds = new Set(
      notificationMethods.filter(m => m.id !== undefined).map(m => m.id!)
    );

    // Delete methods that are no longer in the list
    for (const existingMethod of existingMethods) {
      if (!incomingMethodIds.has(existingMethod._id)) {
        // Delete associated notification settings first
        const settings = await ctx.db
          .query('notificationSettings')
          .withIndex('by_method', q => q.eq('methodId', existingMethod._id))
          .collect();
        for (const setting of settings) {
          await ctx.db.delete(setting._id);
        }
        // Delete the method
        await ctx.db.delete(existingMethod._id);
      }
    }

    // Process each notification method
    for (const method of notificationMethods) {
      let methodId = method.id;

      // Parse webhook headers if provided
      let webhookHeaders = undefined;
      if (method.webhookHeaders) {
        try {
          webhookHeaders = JSON.parse(method.webhookHeaders);
        } catch {
          // Keep as undefined if invalid JSON
        }
      }

      if (methodId && existingMethodIds.has(methodId)) {
        // Update existing method
        await ctx.db.patch(methodId, {
          type: method.type,
          enabled: method.enabled,
          name: method.name,
          value: method.value,
          webhookFormat: method.webhookFormat,
          customTemplate: method.customTemplate,
          webhookHeaders,
          updatedAt: Date.now(),
        });
      } else {
        // Create new method
        methodId = await ctx.db.insert('notificationMethods', {
          settingsId: personSettings._id,
          type: method.type,
          enabled: method.enabled,
          name: method.name,
          value: method.value,
          webhookFormat: method.webhookFormat,
          customTemplate: method.customTemplate,
          webhookHeaders,
          updatedAt: Date.now(),
        });
      }

      // Update notification settings for this method
      // First, get existing settings for this method
      const existingSettings = await ctx.db
        .query('notificationSettings')
        .withIndex('by_method', q => q.eq('methodId', methodId))
        .collect();

      const existingSettingsMap = new Map(
        existingSettings.map(s => [s.notificationType, s])
      );

      // Update or create notification settings
      for (const notification of method.notifications) {
        const existing = existingSettingsMap.get(notification.notificationType);
        if (existing) {
          // Update existing setting
          await ctx.db.patch(existing._id, {
            enabled: notification.enabled,
            updatedAt: Date.now(),
          });
          existingSettingsMap.delete(notification.notificationType);
        } else {
          // Create new setting
          await ctx.db.insert('notificationSettings', {
            methodId,
            notificationType: notification.notificationType,
            enabled: notification.enabled,
            updatedAt: Date.now(),
          });
        }
      }

      // Delete any settings that are no longer in the list
      for (const [, setting] of existingSettingsMap) {
        await ctx.db.delete(setting._id);
      }
    }

    return { success: true };
  },
});

/**
 * Delete a specific notification method
 */
export const deleteNotificationMethod = mutation({
  args: {
    methodId: v.id('notificationMethods'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { methodId }) => {
    const { user } = await requireAuth(ctx);

    const person = await getPersonForUser(ctx, user._id);
    if (!person) {
      throw new Error('Person not found for user');
    }

    // Verify the method belongs to this user
    const method = await ctx.db.get(methodId);
    if (!method) {
      throw new Error('Notification method not found');
    }

    const personSettings = await ctx.db.get(method.settingsId);
    if (!personSettings || personSettings.personId !== person._id) {
      throw new Error('Not authorized to delete this notification method');
    }

    // Delete associated notification settings first
    const settings = await ctx.db
      .query('notificationSettings')
      .withIndex('by_method', q => q.eq('methodId', methodId))
      .collect();
    for (const setting of settings) {
      await ctx.db.delete(setting._id);
    }

    // Delete the method
    await ctx.db.delete(methodId);

    return { success: true };
  },
});
