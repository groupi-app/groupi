/* eslint-disable no-redeclare */
import { z } from 'zod';
import { NotificationSchema, PersonSchema } from '../generated';

// ============================================================================
// NOTIFICATION DOMAIN PARAMETER SCHEMAS
// ============================================================================

// Fetch notifications for person parameters
export const GetNotificationsForPersonParams = z.object({
  cursor: z.string().optional(),
});

export type GetNotificationsForPersonParams = z.infer<
  typeof GetNotificationsForPersonParams
>;

// Mark notification as read parameters
export const MarkNotificationAsReadParams = z.object({
  notificationId: NotificationSchema.shape.id,
});

export type MarkNotificationAsReadParams = z.infer<
  typeof MarkNotificationAsReadParams
>;

// Mark notification as unread parameters
export const MarkNotificationAsUnreadParams = z.object({
  notificationId: NotificationSchema.shape.id,
});

export type MarkNotificationAsUnreadParams = z.infer<
  typeof MarkNotificationAsUnreadParams
>;

// Mark all notifications as read parameters
export const MarkAllNotificationsAsReadParams = z.object({});

export type MarkAllNotificationsAsReadParams = z.infer<
  typeof MarkAllNotificationsAsReadParams
>;

// Create event notifications parameters
export const CreateEventNotificationsParams = z.object({
  eventId: z.string(),
  type: NotificationSchema.shape.type,
  authorId: PersonSchema.shape.id.optional(),
  postId: z.string().optional(),
  datetime: NotificationSchema.shape.datetime.optional(),
  rsvp: NotificationSchema.shape.rsvp.optional(),
});

export type CreateEventNotificationsParams = z.infer<
  typeof CreateEventNotificationsParams
>;
