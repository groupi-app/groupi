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

  /**
   * List all events (admin operation with pagination)
   * Returns: [error, { items, nextCursor, totalCount }] tuple
   */
  listAll: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { db } = await import('@groupi/services');
        const limit = input.limit || 50;
        const search = input.search?.trim();

        // Build where clause for search
        const where = search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' as const } },
                {
                  description: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  location: { contains: search, mode: 'insensitive' as const },
                },
              ],
            }
          : {};

        // Get total count for pagination UI
        const totalCount = await db.event.count({ where });

        // Fetch events with cursor-based pagination
        const events = await db.event.findMany({
          where,
          take: limit + 1, // Fetch one extra to determine if there's a next page
          cursor: input.cursor ? { id: input.cursor } : undefined,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            location: true,
            chosenDateTime: true,
            createdAt: true,
            updatedAt: true,
            memberships: {
              where: { role: 'ORGANIZER' },
              take: 1,
              select: {
                person: {
                  select: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
            _count: {
              select: {
                memberships: true,
                posts: true,
              },
            },
          },
        });

        // Determine if there's a next page
        let nextCursor: string | undefined = undefined;
        if (events.length > limit) {
          const nextItem = events.pop(); // Remove the extra item
          nextCursor = nextItem!.id;
        }

        // Transform data for client
        const items = events.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          chosenDateTime: event.chosenDateTime,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
          organizer: event.memberships[0]?.person.user || null,
          _count: event._count,
        }));

        return [
          null,
          {
            items,
            nextCursor,
            totalCount,
          },
        ] as const;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        return [error, undefined] as const;
      }
    }),
});

export type EventRouter = typeof eventRouter;
