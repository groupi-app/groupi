import { z, extendZodWithOpenApi } from '@hono/zod-openapi';
extendZodWithOpenApi(z);
import { TimestampSchema } from './common';

/**
 * Notification-related API schemas
 */

// Notification type enum
export const NotificationTypeSchema = z
  .enum([
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
    'EVENT_INVITE_RECEIVED',
    'EVENT_INVITE_ACCEPTED',
    'ADDON_CONFIG_RESET',
    'ADDON_AUTOMATION',
  ])
  .openapi({
    example: 'NEW_POST',
    description: 'Type of notification',
  });

// Notification author (nullable if author record was deleted)
const NotificationAuthorSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    user: z.object({
      name: z.string().nullable(),
      email: z.string().nullable(),
    }),
  })
  .nullable();

// Related event reference (nullable)
const NotificationEventSchema = z
  .object({
    id: z.string(),
    title: z.string(),
  })
  .nullable();

// Related post reference (nullable)
const NotificationPostSchema = z
  .object({
    id: z.string(),
    title: z.string(),
  })
  .nullable();

// Full notification schema
export const NotificationSchema = z
  .object({
    id: z.string(),
    personId: z.string(),
    type: NotificationTypeSchema,
    read: z.boolean(),
    createdAt: TimestampSchema,
    event: NotificationEventSchema,
    post: NotificationPostSchema,
    author: NotificationAuthorSchema,
  })
  .openapi('Notification');

// Notification ID parameter
export const NotificationIdParamSchema = z.object({
  notificationId: z.string().openapi({
    example: 'k170xyz...',
    description: 'Notification ID',
  }),
});

// Notification list response
export const NotificationListResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(NotificationSchema),
  })
  .openapi('NotificationListResponse');

// Unread count response
export const UnreadCountResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      count: z.number().int(),
    }),
  })
  .openapi('UnreadCountResponse');

// Generic notification success response
export const NotificationSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      message: z.string(),
    }),
  })
  .openapi('NotificationSuccessResponse');
