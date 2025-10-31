/* eslint-disable no-redeclare */
import { z } from 'zod';
import {
  NotificationSchema,
  EventSchema,
  PostSchema,
  UserSchema,
} from '../generated';

// ============================================================================
// NOTIFICATION DOMAIN DATA TYPES
// ============================================================================

// Basic notification data
export const NotificationData = NotificationSchema.pick({
  id: true,
  type: true,
  read: true,
  createdAt: true,
  datetime: true,
  rsvp: true,
});

export type NotificationData = z.infer<typeof NotificationData>;

// Notification feed data - for notification lists and feeds
export const NotificationFeedData = NotificationData.extend({
  event: EventSchema.pick({
    id: true,
    title: true,
  }).nullable(),
  post: PostSchema.pick({
    id: true,
    title: true,
  }).nullable(),
  author: z
    .object({
      id: z.string(),
      user: UserSchema.pick({
        name: true,
        email: true,
        image: true,
      }),
    })
    .nullable(),
});

export type NotificationFeedData = z.infer<typeof NotificationFeedData>;

// Webhook notification data - for webhook templates and external integrations
export const WebhookNotificationData = NotificationData.extend({
  event: EventSchema.pick({
    id: true,
    title: true,
  }).nullable(),
  post: PostSchema.pick({
    id: true,
    title: true,
  }).nullable(),
  author: z
    .object({
      id: z.string(),
      user: UserSchema.pick({
        name: true,
        email: true,
        image: true,
      }),
    })
    .nullable(),
});

export type WebhookNotificationData = z.infer<typeof WebhookNotificationData>;
