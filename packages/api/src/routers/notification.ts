import { createTRPCRouter, protectedProcedure } from '../trpc';
import {
  // Import service functions
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
  fetchNotificationsForPerson,
} from '@groupi/services';
import { z } from 'zod';

// ============================================================================
// NOTIFICATION ROUTER
// ============================================================================

export const notificationRouter = createTRPCRouter({
  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ input }) => {
      const [error, result] = await markNotificationAsRead({
        notificationId: input.notificationId,
      });

      if (error) {
        throw new Error(error.message);
      }

      return result;
    }),

  /**
   * Mark notification as unread
   */
  markAsUnread: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ input }) => {
      const [error, result] = await markNotificationAsUnread({
        notificationId: input.notificationId,
      });

      if (error) {
        throw new Error(error.message);
      }

      return result;
    }),

  /**
   * Mark all notifications as read for current user
   */
  markAllAsRead: protectedProcedure.mutation(async () => {
    const [error, result] = await markAllNotificationsAsRead({});

    if (error) {
      throw new Error(error.message);
    }

    return result;
  }),

  /**
   * Get notifications for current user
   */
  getForUser: protectedProcedure
    .input(z.object({ cursor: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const [error, result] = await fetchNotificationsForPerson({
        cursor: input.cursor,
      });

      if (error) {
        // Log more detailed error information
        console.error('[tRPC] fetchNotificationsForPerson failed:', {
          error: error.message,
          errorType: error._tag,
          input,
          stack: error.stack,
        });
        throw new Error(`Failed to fetch notifications: ${error.message}`);
      }

      return result;
    }),
});

export type NotificationRouter = typeof notificationRouter;
