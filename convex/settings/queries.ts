import { query } from '../_generated/server';
import { authComponent, getPersonForUser } from '../auth';

/**
 * Get notification settings for the current user
 * Returns all notification methods with their associated notification type settings
 */
export const getNotificationSettings = query({
  args: {},
  handler: async ctx => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return { personSettings: null, notificationMethods: [] };
    }

    const person = await getPersonForUser(ctx, user._id);
    if (!person) {
      return { personSettings: null, notificationMethods: [] };
    }

    // Get or create person settings
    let personSettings = await ctx.db
      .query('personSettings')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .first();

    if (!personSettings) {
      // Return empty state - settings will be created on first save
      return { personSettings: null, notificationMethods: [] };
    }

    // Get all notification methods for this settings
    const notificationMethods = await ctx.db
      .query('notificationMethods')
      .withIndex('by_settings', q => q.eq('settingsId', personSettings._id))
      .collect();

    // For each notification method, get its notification type settings
    const methodsWithSettings = await Promise.all(
      notificationMethods.map(async method => {
        const notificationSettings = await ctx.db
          .query('notificationSettings')
          .withIndex('by_method', q => q.eq('methodId', method._id))
          .collect();

        return {
          id: method._id,
          type: method.type,
          enabled: method.enabled,
          name: method.name,
          value: method.value,
          webhookFormat: method.webhookFormat,
          customTemplate: method.customTemplate,
          webhookHeaders: method.webhookHeaders,
          notifications: notificationSettings.map(ns => ({
            notificationType: ns.notificationType,
            enabled: ns.enabled,
          })),
        };
      })
    );

    return {
      personSettings: {
        id: personSettings._id,
        personId: personSettings.personId,
      },
      notificationMethods: methodsWithSettings,
    };
  },
});
