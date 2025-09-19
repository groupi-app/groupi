import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import {
  // Import schemas from @groupi/schema
  NotificationSchema,
  NotificationTypeSchema,
  PersonSchema,
} from '@groupi/schema';
import {
  createNotification,
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
  markEventNotifsAsRead,
  markPostNotifsAsRead,
  deleteNotification,
  deleteAllNotifications,
  fetchNotificationsForPerson,
  createEventNotifs,
  createEventModNotifs,
  createPostNotifs,
} from '@groupi/services';

// ============================================================================
// INPUT SCHEMAS (using @groupi/schema)
// ============================================================================

// Create notification schema - pick only the fields we need from the client
export const CreateNotificationInputSchema = NotificationSchema.pick({
  type: true,
  datetime: true,
}).extend({
  personId: z.string().cuid(),
  eventId: z.string().cuid().optional(),
  authorId: z.string().cuid().optional(),
  postId: z.string().cuid().optional(),
});

// Notification actions schemas
export const MarkNotificationInputSchema = NotificationSchema.pick({
  id: true,
});
export const GetUserNotificationsInputSchema = PersonSchema.pick({ id: true });

// Event notifications schema
export const CreateEventNotificationsInputSchema = z.object({
  eventId: z.string().cuid(),
  type: NotificationTypeSchema,
  postId: z.string().cuid().optional(),
  datetime: z.date().optional(),
});

// Event moderator notifications schema
export const CreateEventModNotificationsInputSchema = z.object({
  eventId: z.string().cuid(),
  type: NotificationTypeSchema,
  rsvp: z.enum(['YES', 'NO', 'MAYBE', 'PENDING']).optional(),
});

type EventModNotificationType = Exclude<
  z.infer<typeof NotificationTypeSchema>,
  'NEW_REPLY'
>;

// Post notifications schema
export const CreatePostNotificationsInputSchema = z.object({
  postId: z.string().cuid(),
  type: z.literal('NEW_REPLY'),
});

// Legacy schemas for backward compatibility
const CreateNotificationSchemaLegacy = z.object({
  type: z.string(),
  personId: z.string(),
  eventId: z.string().optional(),
  authorId: z.string().optional(),
  postId: z.string().optional(),
  datetime: z.date().optional(),
});

const MarkNotificationSchemaLegacy = z.object({
  notificationId: z.string(),
});

const GetUserNotificationsSchemaLegacy = z.object({
  userId: z.string(),
});

const CreateEventNotificationsSchemaLegacy = z.object({
  eventId: z.string(),
  type: z.string(),
  postId: z.string().optional(),
  datetime: z.date().optional(),
});

const CreateEventModNotificationsSchemaLegacy = z.object({
  eventId: z.string(),
  type: z.string(),
  rsvp: z.string().optional(),
});

const CreatePostNotificationsSchemaLegacy = z.object({
  postId: z.string(),
  type: z.string(),
});

// ============================================================================
// NOTIFICATION ROUTER
// ============================================================================

export const notificationRouter = createTRPCRouter({
  /**
   * Create individual notification (using schema-based validation)
   * Returns: [error, notification] tuple
   */
  create: protectedProcedure
    .input(CreateNotificationInputSchema)
    .mutation(async ({ input, ctx: _ctx }) => {
      return await createNotification(
        {
          type: input.type,
          personId: input.personId,
          eventId: input.eventId || null,
          authorId: input.authorId || null,
          postId: input.postId || null,
          datetime: input.datetime,
          read: false,
          rsvp: null,
        },
        _ctx.userId
      );
    }),

  /**
   * Create individual notification (legacy endpoint)
   * Returns: [error, notification] tuple
   */
  createLegacy: protectedProcedure
    .input(CreateNotificationSchemaLegacy)
    .mutation(async ({ input, ctx: _ctx }) => {
      return await createNotification(
        {
          type: input.type as any,
          personId: input.personId,
          eventId: input.eventId || null,
          authorId: input.authorId || null,
          postId: input.postId || null,
          datetime: input.datetime || null,
          rsvp: null,
          read: false,
        },
        _ctx.userId
      );
    }),

  /**
   * Mark notification as read (using schema-based validation)
   * Returns: [error, notification] tuple
   */
  markAsRead: protectedProcedure
    .input(
      MarkNotificationInputSchema.transform(data => ({
        notificationId: data.id,
      }))
    )
    .mutation(async ({ input, ctx: _ctx }) => {
      return await markNotificationAsRead(input.notificationId, _ctx.userId);
    }),

  /**
   * Mark notification as read (legacy endpoint)
   * Returns: [error, notification] tuple
   */
  markAsReadLegacy: protectedProcedure
    .input(MarkNotificationSchemaLegacy)
    .mutation(async ({ input, ctx: _ctx }) => {
      return await markNotificationAsRead(input.notificationId, _ctx.userId);
    }),

  /**
   * Mark all notifications as read for a user (using schema-based validation)
   * Returns: [error, result] tuple
   */
  markAllAsRead: protectedProcedure
    .input(
      GetUserNotificationsInputSchema.transform(data => ({ userId: data.id }))
    )
    .mutation(async ({ input, ctx: _ctx }) => {
      return await markAllNotificationsAsRead(input.userId);
    }),

  /**
   * Mark all notifications as read for a user (legacy endpoint)
   * Returns: [error, result] tuple
   */
  markAllAsReadLegacy: protectedProcedure
    .input(GetUserNotificationsSchemaLegacy)
    .mutation(async ({ input, ctx: _ctx }) => {
      return await markAllNotificationsAsRead(input.userId);
    }),

  /**
   * Get notifications for a user (using schema-based validation)
   * Returns: [error, notifications] tuple
   */
  getForUser: protectedProcedure
    .input(
      GetUserNotificationsInputSchema.transform(data => ({ userId: data.id }))
    )
    .query(async ({ input, ctx: _ctx }) => {
      return await fetchNotificationsForPerson(input.userId, input.userId);
    }),

  /**
   * Get notifications for a user (legacy endpoint)
   * Returns: [error, notifications] tuple
   */
  getForUserLegacy: protectedProcedure
    .input(GetUserNotificationsSchemaLegacy)
    .query(async ({ input, ctx: _ctx }) => {
      return await fetchNotificationsForPerson(input.userId, input.userId);
    }),

  /**
   * Mark notification as unread (using schema-based validation)
   * Returns: [error, notification] tuple
   */
  markAsUnread: protectedProcedure
    .input(
      MarkNotificationInputSchema.transform(data => ({
        notificationId: data.id,
      }))
    )
    .mutation(async ({ input, ctx }) => {
      return await markNotificationAsUnread(input.notificationId, ctx.userId);
    }),

  /**
   * Mark notification as unread (legacy endpoint)
   * Returns: [error, notification] tuple
   */
  markAsUnreadLegacy: protectedProcedure
    .input(MarkNotificationSchemaLegacy)
    .mutation(async ({ input, ctx }) => {
      return await markNotificationAsUnread(input.notificationId, ctx.userId);
    }),

  /**
   * Mark all event notifications as read (using schema-based validation)
   * Returns: [error, count] tuple
   */
  markEventNotifsAsRead: protectedProcedure
    .input(z.object({ eventId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      return await markEventNotifsAsRead(input.eventId, ctx.userId);
    }),

  /**
   * Mark all post notifications as read (using schema-based validation)
   * Returns: [error, count] tuple
   */
  markPostNotifsAsRead: protectedProcedure
    .input(z.object({ postId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      return await markPostNotifsAsRead(input.postId, ctx.userId);
    }),

  /**
   * Delete single notification (using schema-based validation)
   * Returns: [error, notification] tuple
   */
  delete: protectedProcedure
    .input(
      MarkNotificationInputSchema.transform(data => ({
        notificationId: data.id,
      }))
    )
    .mutation(async ({ input, ctx }) => {
      return await deleteNotification(input.notificationId, ctx.userId);
    }),

  /**
   * Delete single notification (legacy endpoint)
   * Returns: [error, notification] tuple
   */
  deleteLegacy: protectedProcedure
    .input(MarkNotificationSchemaLegacy)
    .mutation(async ({ input, ctx }) => {
      return await deleteNotification(input.notificationId, ctx.userId);
    }),

  /**
   * Delete all notifications for a user
   * Returns: [error, count] tuple
   */
  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    return await deleteAllNotifications(ctx.userId);
  }),

  /**
   * Create event notifications (using schema-based validation)
   * Returns: [error, count] tuple
   */
  createEventNotifs: protectedProcedure
    .input(CreateEventNotificationsInputSchema)
    .mutation(async ({ input, ctx: _ctx }) => {
      return await createEventNotifs(
        input.eventId,
        input.type as any, // TODO: Update schema to match service types
        _ctx.userId,
        input.postId,
        input.datetime
      );
    }),

  /**
   * Create event notifications (legacy endpoint)
   * Returns: [error, count] tuple
   */
  createEventNotifsLegacy: protectedProcedure
    .input(CreateEventNotificationsSchemaLegacy)
    .mutation(async ({ input, ctx: _ctx }) => {
      return await createEventNotifs(
        input.eventId,
        input.type as any,
        _ctx.userId,
        input.postId,
        input.datetime
      );
    }),

  /**
   * Create event moderator notifications (using schema-based validation)
   * Returns: [error, count] tuple
   */
  createEventModNotifs: protectedProcedure
    .input(
      CreateEventModNotificationsInputSchema.refine(
        data => data.type !== 'NEW_REPLY',
        {
          message: 'NEW_REPLY is not valid for event moderator notifications',
          path: ['type'],
        }
      )
    )
    .mutation(async ({ input, ctx: _ctx }) => {
      return await createEventModNotifs(
        input.eventId,
        input.type as EventModNotificationType,
        _ctx.userId,
        input.rsvp as any
      );
    }),

  /**
   * Create event moderator notifications (legacy endpoint)
   * Returns: [error, count] tuple
   */
  createEventModNotifsLegacy: protectedProcedure
    .input(CreateEventModNotificationsSchemaLegacy)
    .mutation(async ({ input, ctx: _ctx }) => {
      return await createEventModNotifs(
        input.eventId,
        input.type as EventModNotificationType,
        _ctx.userId,
        input.rsvp as any
      );
    }),

  /**
   * Create post notifications (using schema-based validation)
   * Returns: [error, count] tuple
   */
  createPostNotifs: protectedProcedure
    .input(CreatePostNotificationsInputSchema)
    .mutation(async ({ input, ctx: _ctx }) => {
      return await createPostNotifs(input.postId, input.type, _ctx.userId);
    }),

  /**
   * Create post notifications (legacy endpoint)
   * Returns: [error, count] tuple
   */
  createPostNotifsLegacy: protectedProcedure
    .input(CreatePostNotificationsSchemaLegacy)
    .mutation(async ({ input, ctx: _ctx }) => {
      return await createPostNotifs(
        input.postId,
        input.type as any,
        _ctx.userId
      );
    }),
});

export type NotificationRouter = typeof notificationRouter;
