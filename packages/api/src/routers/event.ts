import { createTRPCRouter, protectedProcedure } from '../trpc';
import {
  // Import service functions
  createEvent,
  updateEventDetails,
  deleteEvent,
  leaveEvent,
  getEventHeaderData,
  getEventNewPostPageData,
  getEventAttendeesPageData,
  getMemberListData,
} from '@groupi/services';
import { CreateEventParams } from '@groupi/schema/params';
import { z } from 'zod';

// ============================================================================
// EVENT ROUTER
// ============================================================================

export const eventRouter = createTRPCRouter({
  /**
   * Get event header data
   */
  getHeaderData: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      return await getEventHeaderData({
        eventId: input.eventId,
      });
    }),

  /**
   * Get event new post page data
   */
  getNewPostPageData: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      return await getEventNewPostPageData({
        eventId: input.eventId,
      });
    }),

  /**
   * Get event attendees page data
   */
  getAttendeesPageData: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      return await getEventAttendeesPageData({
        eventId: input.eventId,
      });
    }),

  /**
   * Get member list data
   */
  getMemberListData: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      return await getMemberListData({
        eventId: input.eventId,
      });
    }),

  /**
   * Create a new event
   */
  create: protectedProcedure
    .input(CreateEventParams)
    .mutation(async ({ input }) => {
      return await createEvent({
        title: input.title,
        description: input.description || '',
        location: input.location || '',
        potentialDateTimes: input.potentialDateTimes,
      });
    }),

  /**
   * Update event details
   */
  updateDetails: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        location: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await updateEventDetails({
        eventId: input.eventId,
        title: input.title,
        description: input.description,
        location: input.location,
      });
    }),

  /**
   * Delete an event
   */
  delete: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteEvent({
        eventId: input.eventId,
      });
    }),

  /**
   * Leave an event
   */
  leave: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input }) => {
      return await leaveEvent({
        eventId: input.eventId,
      });
    }),
});

export type EventRouter = typeof eventRouter;
