import {
  notificationMethodValidator,
  saveNotificationSettingsForPerson,
} from '../../../settings/mutations';
import { internalQuery, internalMutation } from '../../../_generated/server';
import { v, ConvexError } from 'convex/values';
import type { Id } from '../../../_generated/dataModel';

/**
 * Internal queries and mutations for settings routes
 */

export const getPrivacySettings = internalQuery({
  args: {
    personId: v.string(),
  },
  handler: async (ctx, { personId }) => {
    const settings = await ctx.db
      .query('personSettings')
      .withIndex('by_person', q => q.eq('personId', personId as Id<'persons'>))
      .first();

    return {
      allowFriendRequestsFrom: settings?.allowFriendRequestsFrom ?? 'EVERYONE',
      allowEventInvitesFrom: settings?.allowEventInvitesFrom ?? 'EVERYONE',
      allowGroupInvitesFrom: settings?.allowGroupInvitesFrom ?? 'EVERYONE',
    };
  },
});

export const updatePrivacySettings = internalMutation({
  args: {
    personId: v.string(),
    allowFriendRequestsFrom: v.optional(
      v.union(
        v.literal('EVERYONE'),
        v.literal('EVENT_MEMBERS'),
        v.literal('NO_ONE')
      )
    ),
    allowGroupInvitesFrom: v.optional(
      v.union(v.literal('EVERYONE'), v.literal('FRIENDS'), v.literal('NO_ONE'))
    ),
    allowEventInvitesFrom: v.optional(
      v.union(
        v.literal('EVERYONE'),
        v.literal('EVENT_MEMBERS'),
        v.literal('FRIENDS'),
        v.literal('NO_ONE')
      )
    ),
  },
  handler: async (
    ctx,
    {
      personId,
      allowFriendRequestsFrom,
      allowEventInvitesFrom,
      allowGroupInvitesFrom,
    }
  ) => {
    const pId = personId as Id<'persons'>;

    const existing = await ctx.db
      .query('personSettings')
      .withIndex('by_person', q => q.eq('personId', pId))
      .first();

    const updateData: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (allowFriendRequestsFrom !== undefined) {
      updateData.allowFriendRequestsFrom = allowFriendRequestsFrom;
    }
    if (allowEventInvitesFrom !== undefined) {
      updateData.allowEventInvitesFrom = allowEventInvitesFrom;
    }

    if (allowGroupInvitesFrom !== undefined)
      updateData.allowGroupInvitesFrom = allowGroupInvitesFrom;
    if (existing) {
      await ctx.db.patch(existing._id, updateData);
    } else {
      await ctx.db.insert('personSettings', {
        personId: pId,
        ...updateData,
      } as {
        personId: Id<'persons'>;
        updatedAt: number;
        allowFriendRequestsFrom?: 'EVERYONE' | 'EVENT_MEMBERS' | 'NO_ONE';
        allowEventInvitesFrom?:
          | 'EVERYONE'
          | 'EVENT_MEMBERS'
          | 'FRIENDS'
          | 'NO_ONE';
      });
    }

    // Return updated settings
    const updated = await ctx.db
      .query('personSettings')
      .withIndex('by_person', q => q.eq('personId', pId))
      .first();

    return {
      allowFriendRequestsFrom: updated?.allowFriendRequestsFrom ?? 'EVERYONE',
      allowEventInvitesFrom: updated?.allowEventInvitesFrom ?? 'EVERYONE',
    };
  },
});

export const getNotificationSettings = internalQuery({
  args: {
    personId: v.string(),
  },
  handler: async (ctx, { personId }) => {
    const pId = personId as Id<'persons'>;

    // Get person settings to find notification methods
    const settings = await ctx.db
      .query('personSettings')
      .withIndex('by_person', q => q.eq('personId', pId))
      .first();

    if (!settings) {
      return {
        methods: [],
        typeSettings: [],
      };
    }

    // Get notification methods for this settings record
    const methods = await ctx.db
      .query('notificationMethods')
      .withIndex('by_settings', q => q.eq('settingsId', settings._id))
      .collect();

    // Get notification type settings for each method
    const typeSettings = await Promise.all(
      methods.map(async method => {
        const settings = await ctx.db
          .query('notificationSettings')
          .withIndex('by_method', q => q.eq('methodId', method._id))
          .collect();
        return settings;
      })
    );

    return {
      methods: methods.map(m => ({
        id: m._id as string,
        type: m.type,
        enabled: m.enabled,
        name: m.name ?? null,
        value: m.value,
        webhookFormat: m.webhookFormat ?? null,
      })),
      typeSettings: typeSettings.flat().map(ts => ({
        notificationType: ts.notificationType,
        methodId: ts.methodId as string,
        enabled: ts.enabled,
      })),
    };
  },
});

export const saveNotificationSettings = internalMutation({
  args: {
    personId: v.id('persons'),
    notificationMethods: v.array(
      v.object({
        ...notificationMethodValidator.fields,
        id: v.optional(v.string()),
      })
    ),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { personId, notificationMethods }) => {
    const methods = notificationMethods.map(method => {
      const id = method.id
        ? ctx.db.normalizeId('notificationMethods', method.id)
        : undefined;
      if (method.id && !id)
        throw new ConvexError({
          code: 'VALIDATION_ERROR',
          message: 'Provide valid notification method IDs.',
        });
      return { ...method, id: id ?? undefined };
    });
    return saveNotificationSettingsForPerson(ctx, personId, methods);
  },
});
