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
    allowFriendRequestsFrom: FriendRequestPermissionSchema.nullable(),
    allowEventInvitesFrom: EventInvitePermissionSchema.nullable(),
  })
  .openapi('PrivacySettings');

// Update privacy settings request
export const UpdatePrivacySettingsRequestSchema = z
  .object({
    allowFriendRequestsFrom: FriendRequestPermissionSchema.optional().openapi({
      description: 'Who can send friend requests',
    }),
    allowEventInvitesFrom: EventInvitePermissionSchema.optional().openapi({
      description: 'Who can send event invites',
    }),
  })
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
