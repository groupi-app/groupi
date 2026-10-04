import { query } from '../_generated/server';
import { authComponent, getPersonForUser } from '../auth';
import { v } from 'convex/values';

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
          notifications: [
            ...notificationSettings.map(ns => ({
              notificationType: ns.notificationType,
              enabled: ns.enabled,
            })),
            ...(
              [
                'GROUP_INVITE_RECEIVED',
                'GROUP_INVITE_ACCEPTED',
                'GROUP_MEMBER_REMOVED',
                'GROUP_MEMBER_BANNED',
                'GROUP_APPLICATION_RECEIVED',
                'GROUP_APPLICATION_APPROVED',
                'GROUP_APPLICATION_DECLINED',
                'GROUP_ANNOUNCEMENT',
              ] as const
            )
              .filter(
                type =>
                  !notificationSettings.some(ns => ns.notificationType === type)
              )
              .map(notificationType => ({ notificationType, enabled: true })),
          ],
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

/**
 * Get privacy settings for the current user
 * Returns defaults when no settings are stored.
 */
export const getPrivacySettings = query({
  args: {
    _traceId: v.optional(v.string()),
  },
  handler: async ctx => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return null;
    }

    const person = await getPersonForUser(ctx, user._id);
    if (!person) {
      return null;
    }

    const personSettings = await ctx.db
      .query('personSettings')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .first();

    return {
      allowGroupInvitesFrom:
        personSettings?.allowGroupInvitesFrom ?? 'EVERYONE',
      allowFriendRequestsFrom:
        personSettings?.allowFriendRequestsFrom ?? 'EVERYONE',
      allowEventInvitesFrom:
        personSettings?.allowEventInvitesFrom ?? 'EVERYONE',
    };
  },
});
