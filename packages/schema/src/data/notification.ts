/* eslint-disable no-redeclare */
import { z } from 'zod';
import {
  NotificationSchema,
  EventSchema,
  PostSchema,
  UserSchema,
} from '../generated';

// ============================================================================
// NOTIFICATION DOMAIN DATA DTOS
// ============================================================================

// Basic notification DTO
export const NotificationDTO = NotificationSchema.pick({
  id: true,
  type: true,
  read: true,
  createdAt: true,
  datetime: true,
  rsvp: true,
});

export type NotificationDTO = z.infer<typeof NotificationDTO>;

// Notification feed DTO - for notification lists and feeds
export const NotificationFeedDTO = NotificationDTO.extend({
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

export type NotificationFeedDTO = z.infer<typeof NotificationFeedDTO>;

// Webhook notification DTO - for webhook templates and external integrations
export const WebhookNotificationDTO = NotificationDTO.extend({
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

export type WebhookNotificationDTO = z.infer<typeof WebhookNotificationDTO>;
