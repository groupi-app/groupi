import { z, extendZodWithOpenApi } from '@hono/zod-openapi';
extendZodWithOpenApi(z);

/**
 * Settings-related API schemas
 */

// Privacy setting enums
export const FriendRequestPermissionSchema = z
  .enum(['EVERYONE', 'EVENT_MEMBERS', 'NO_ONE'])
  .openapi({
    example: 'EVERYONE',
    description: 'Who can send friend requests to this user',
  });

export const EventInvitePermissionSchema = z
  .enum(['EVERYONE', 'EVENT_MEMBERS', 'FRIENDS', 'NO_ONE'])
  .openapi({
    example: 'EVERYONE',
    description: 'Who can send event invites to this user',
  });

// Privacy settings schema
export const PrivacySettingsSchema = z
  .object({
    allowGroupInvitesFrom: z.enum(['EVERYONE', 'FRIENDS', 'NO_ONE']).optional(),
    allowFriendRequestsFrom: FriendRequestPermissionSchema.nullable(),
    allowEventInvitesFrom: EventInvitePermissionSchema.nullable(),
  })
  .openapi('PrivacySettings');

// Update privacy settings request
export const UpdatePrivacySettingsRequestSchema = z
  .object({
    allowGroupInvitesFrom: z.enum(['EVERYONE', 'FRIENDS', 'NO_ONE']).optional(),
    allowFriendRequestsFrom: FriendRequestPermissionSchema.optional().openapi({
      description: 'Who can send friend requests',
    }),
    allowEventInvitesFrom: EventInvitePermissionSchema.optional().openapi({
      description: 'Who can send event invites',
    }),
  })
  .strict()
  .refine(
    data => Object.keys(data).length > 0,
    'Provide at least one privacy field'
  )
  .openapi('UpdatePrivacySettingsRequest');

// Notification method schema
export const NotificationMethodSchema = z
  .object({
    id: z.string(),
    type: z.enum(['EMAIL', 'PUSH', 'WEBHOOK']),
    enabled: z.boolean(),
    name: z.string().nullable(),
    value: z.string(),
    webhookFormat: z
      .enum(['DISCORD', 'SLACK', 'TEAMS', 'GENERIC', 'CUSTOM'])
      .nullable(),
  })
  .openapi('NotificationMethod');

// Notification type setting schema
export const NotificationTypeSettingSchema = z
  .object({
    notificationType: z.string(),
    methodId: z.string(),
    enabled: z.boolean(),
  })
  .openapi('NotificationTypeSetting');

// Notification settings response
export const NotificationSettingsSchema = z
  .object({
    methods: z.array(NotificationMethodSchema),
    typeSettings: z.array(NotificationTypeSettingSchema),
  })
  .openapi('NotificationSettings');

export const UpdateNotificationSettingsRequestSchema = z
  .object({
    notificationMethods: z.array(
      z
        .object({
          id: z.string().optional(),
          type: z.enum(['EMAIL', 'PUSH', 'WEBHOOK']),
          enabled: z.boolean(),
          name: z.string().optional(),
          value: z.string(),
          webhookFormat: z
            .enum(['DISCORD', 'SLACK', 'TEAMS', 'GENERIC', 'CUSTOM'])
            .optional(),
          customTemplate: z.string().optional(),
          webhookHeaders: z.string().optional(),
          notifications: z.array(
            z
              .object({
                notificationType: z.enum([
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
                  'FRIEND_REQUEST_RECEIVED',
                  'FRIEND_REQUEST_ACCEPTED',
                  'GROUP_INVITE_RECEIVED',
                  'GROUP_INVITE_ACCEPTED',
                  'GROUP_MEMBER_REMOVED',
                  'GROUP_MEMBER_BANNED',
                  'GROUP_APPLICATION_RECEIVED',
                  'GROUP_APPLICATION_APPROVED',
                  'GROUP_APPLICATION_DECLINED',
                  'GROUP_ANNOUNCEMENT',
                  'EVENT_INVITE_RECEIVED',
                  'EVENT_INVITE_ACCEPTED',
                  'ADDON_CONFIG_RESET',
                  'ADDON_AUTOMATION',
                ]),
                enabled: z.boolean(),
              })
              .strict()
          ),
        })
        .strict()
    ),
  })
  .strict()
  .openapi('UpdateNotificationSettingsRequest');
