/* eslint-disable no-redeclare */
import { z } from 'zod';
import type {
  Notification as PrismaNotification,
  Person,
  Event,
  Post,
} from '../generated';
import { NotificationSchema, EventSchema, PostSchema } from '../generated';
import { AuthorDTO } from './person';

// Notification feed DTO - for notification lists and feeds
export const NotificationFeedDTO = NotificationSchema.pick({
  id: true,
  type: true,
  read: true,
  createdAt: true,
  datetime: true,
  rsvp: true,
}).extend({
  event: EventSchema.pick({
    id: true,
    title: true,
  }).nullable(),
  post: PostSchema.pick({
    id: true,
    title: true,
  }).nullable(),
  author: AuthorDTO.nullable(),
});

export type NotificationFeedDTO = z.infer<typeof NotificationFeedDTO>;

// Type for Prisma notification with relations
export type NotificationWithRelations = PrismaNotification & {
  event?: Event | null;
  post?: Post | null;
  author?: Person | null;
};

// Factory function to create DTO from Prisma data
export function createNotificationFeedDTO(
  notification: NotificationWithRelations
): NotificationFeedDTO {
  return {
    id: notification.id,
    type: notification.type,
    read: notification.read,
    createdAt: notification.createdAt,
    datetime: notification.datetime,
    rsvp: notification.rsvp,
    event: notification.event
      ? {
          id: notification.event.id,
          title: notification.event.title,
        }
      : null,
    post: notification.post
      ? {
          id: notification.post.id,
          title: notification.post.title,
        }
      : null,
    author: notification.author
      ? {
          id: notification.author.id,
          firstName: notification.author.firstName,
          lastName: notification.author.lastName,
          username: notification.author.username,
          imageUrl: notification.author.imageUrl,
        }
      : null,
  };
}
