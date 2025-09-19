import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import {
  // Import schemas from @groupi/schema with the names we want
  EventSchema,
} from '@groupi/schema';
import {
  // Import safe-wrapper service functions
  fetchEventData,
  fetchEventPageData,
  createEvent,
  updateEventDetails,
  updateEventDateTime,
  updateEventPotentialDateTimes,
  deleteEvent,
  leaveEvent,
  // Import event page services (consolidated)
  getEventHeaderData,
  getMemberListData,
  getPostFeedData,
  getEventAttendeesPageData,
  getEventNewPostPageData,
  getEventEditPageData,
  getEventChangeDatePageData,
  getEventChangeDateSinglePageData,
  getEventChangeDateMultiPageData,
} from '@groupi/services';
import { db } from '@groupi/services';

// ============================================================================
// INPUT SCHEMAS (using @groupi/schema)
// ============================================================================

// Get event by ID schema
export const GetEventInputSchema = EventSchema.pick({ id: true });

// For event creation, we need to add potentialDateTimes as a simple string array
// since the Prisma schema expects complex nested relations but our service expects simple strings
export const CreateEventInputSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  potentialDateTimes: z
    .array(z.string())
    .min(1, 'At least one date option is required'),
});

// Specific update schemas for different operations
export const UpdateEventDetailsInputSchema = z.object({
  eventId: z.string().cuid(),
  title: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
});

export const UpdateEventDateTimeInputSchema = z.object({
  eventId: z.string().cuid(),
  dateTime: z.string(), // ISO string
});

export const UpdateEventPotentialDateTimesInputSchema = z.object({
  eventId: z.string().cuid(),
  potentialDateTimes: z
    .array(z.string())
    .min(1, 'At least one date option is required'),
});

// Legacy schemas for backward compatibility
const GetEventSchema = z.object({
  eventId: z.string(),
});

const CreateEventSchemaLegacy = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().min(1, 'Location is required'),
  potentialDateTimes: z
    .array(z.string())
    .min(1, 'At least one date option is required'),
});

const UpdateEventDetailsSchemaLegacy = z.object({
  eventId: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().min(1, 'Location is required'),
});

const UpdateEventDateTimeSchemaLegacy = z.object({
  eventId: z.string(),
  dateTime: z.string(), // ISO string
});

const UpdateEventPotentialDateTimesSchemaLegacy = z.object({
  eventId: z.string(),
  potentialDateTimes: z
    .array(z.string())
    .min(1, 'At least one date option is required'),
});

// ============================================================================
// EVENT ROUTER
// ============================================================================

export const eventRouter = createTRPCRouter({
  /**
   * Granular: Event core details (no relations)
   */
  getDetails: protectedProcedure
    .input(GetEventInputSchema)
    .query(async ({ input }) => {
      const event = await db.event.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          chosenDateTime: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return event;
    }),
  /**
   * Get event data by ID (using schema-based validation)
   * Returns: [error, eventDTO] tuple
   */
  getById: protectedProcedure
    .input(GetEventInputSchema.transform(data => ({ eventId: data.id })))
    .query(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await fetchEventData(input.eventId, ctx.userId);
    }),

  /**
   * Get event page data with permissions (using schema-based validation)
   * Returns: [error, eventPageDTO] tuple
   */
  getPageData: protectedProcedure
    .input(GetEventInputSchema.transform(data => ({ eventId: data.id })))
    .query(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await fetchEventPageData(input.eventId, ctx.userId);
    }),

  /**
   * Get event data by ID (legacy endpoint)
   * Returns: [error, eventDTO] tuple
   */
  getByIdLegacy: protectedProcedure
    .input(GetEventSchema)
    .query(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await fetchEventData(input.eventId, ctx.userId);
    }),

  /**
   * Get event page data with permissions (legacy endpoint)
   * Returns: [error, eventPageDTO] tuple
   */
  getPageDataLegacy: protectedProcedure
    .input(GetEventSchema)
    .query(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await fetchEventPageData(input.eventId, ctx.userId);
    }),

  /**
   * Create a new event (using schema-based validation)
   * Client sends: { title, description?, location?, potentialDateTimes }
   * Returns: [error, event] tuple
   */
  create: protectedProcedure
    .input(CreateEventInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await createEvent(
        {
          title: input.title,
          description: input.description,
          location: input.location,
          potentialDateTimes: input.potentialDateTimes,
        },
        ctx.userId
      );
    }),

  /**
   * Create a new event (legacy endpoint)
   * Returns: [error, event] tuple
   */
  createLegacy: protectedProcedure
    .input(CreateEventSchemaLegacy)
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await createEvent(
        {
          title: input.title,
          description: input.description,
          location: input.location,
          potentialDateTimes: input.potentialDateTimes,
        },
        ctx.userId
      );
    }),

  /**
   * Update event details (using schema-based validation)
   * Returns: [error, event] tuple
   */
  updateDetails: protectedProcedure
    .input(UpdateEventDetailsInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await updateEventDetails(
        {
          id: input.eventId,
          title: input.title || '',
          description: input.description,
          location: input.location,
        },
        ctx.userId
      );
    }),

  /**
   * Update event details (legacy endpoint)
   * Returns: [error, event] tuple
   */
  updateDetailsLegacy: protectedProcedure
    .input(UpdateEventDetailsSchemaLegacy)
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await updateEventDetails(
        {
          id: input.eventId,
          title: input.title,
          description: input.description,
          location: input.location,
        },
        ctx.userId
      );
    }),

  /**
   * Update event chosen date/time (using schema-based validation)
   * Returns: [error, event] tuple
   */
  updateDateTime: protectedProcedure
    .input(UpdateEventDateTimeInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await updateEventDateTime(
        input.eventId,
        input.dateTime,
        ctx.userId
      );
    }),

  /**
   * Update event chosen date/time (legacy endpoint)
   * Returns: [error, event] tuple
   */
  updateDateTimeLegacy: protectedProcedure
    .input(UpdateEventDateTimeSchemaLegacy)
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await updateEventDateTime(
        input.eventId,
        input.dateTime,
        ctx.userId
      );
    }),

  /**
   * Update event potential date/time options (using schema-based validation)
   * Returns: [error, event] tuple
   */
  updatePotentialDateTimes: protectedProcedure
    .input(UpdateEventPotentialDateTimesInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await updateEventPotentialDateTimes(
        input.eventId,
        input.potentialDateTimes,
        ctx.userId
      );
    }),

  /**
   * Update event potential date/time options (legacy endpoint)
   * Returns: [error, event] tuple
   */
  updatePotentialDateTimesLegacy: protectedProcedure
    .input(UpdateEventPotentialDateTimesSchemaLegacy)
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await updateEventPotentialDateTimes(
        input.eventId,
        input.potentialDateTimes,
        ctx.userId
      );
    }),

  /**
   * Delete an event (using schema-based validation)
   * Returns: [error, result] tuple
   */
  delete: protectedProcedure
    .input(GetEventInputSchema.transform(data => ({ eventId: data.id })))
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await deleteEvent(input.eventId, ctx.userId);
    }),

  /**
   * Delete an event (legacy endpoint)
   * Returns: [error, result] tuple
   */
  deleteLegacy: protectedProcedure
    .input(GetEventSchema)
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await deleteEvent(input.eventId, ctx.userId);
    }),

  /**
   * Leave an event (using schema-based validation)
   * Returns: [error, result] tuple
   */
  leave: protectedProcedure
    .input(GetEventInputSchema.transform(data => ({ eventId: data.id })))
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await leaveEvent(input.eventId, ctx.userId);
    }),

  /**
   * Leave an event (legacy endpoint)
   * Returns: [error, result] tuple
   */
  leaveLegacy: protectedProcedure
    .input(GetEventSchema)
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await leaveEvent(input.eventId, ctx.userId);
    }),

  // ============================================================================
  // COMPONENT-SPECIFIC DATA ENDPOINTS
  // ============================================================================

  /**
   * Get event header data
   * Returns: [error, EventHeaderData] tuple
   */
  getHeaderData: protectedProcedure
    .input(GetEventInputSchema.transform(data => ({ eventId: data.id })))
    .query(async ({ input, ctx }) => {
      return await getEventHeaderData(input.eventId, ctx.userId);
    }),

  /**
   * Get member list data
   * Returns: [error, MemberListData] tuple
   */
  getMemberListData: protectedProcedure
    .input(GetEventInputSchema.transform(data => ({ eventId: data.id })))
    .query(async ({ input, ctx }) => {
      return await getMemberListData(input.eventId, ctx.userId);
    }),

  /**
   * Get post feed data
   * Returns: [error, PostFeedData] tuple
   */
  getPostFeedData: protectedProcedure
    .input(GetEventInputSchema.transform(data => ({ eventId: data.id })))
    .query(async ({ input, ctx }) => {
      return await getPostFeedData(input.eventId, ctx.userId);
    }),

  /**
   * Get attendees page data
   * Returns: [error, EventAttendeesPageData] tuple
   */
  getAttendeesPageData: protectedProcedure
    .input(GetEventInputSchema.transform(data => ({ eventId: data.id })))
    .query(async ({ input, ctx }) => {
      return await getEventAttendeesPageData(input.eventId, ctx.userId);
    }),

  /**
   * Get new post page data
   * Returns: [error, EventNewPostPageData] tuple
   */
  getNewPostPageData: protectedProcedure
    .input(GetEventInputSchema.transform(data => ({ eventId: data.id })))
    .query(async ({ input, ctx }) => {
      return await getEventNewPostPageData(input.eventId, ctx.userId);
    }),

  /**
   * Get edit page data
   * Returns: [error, EventEditPageData] tuple
   */
  getEditPageData: protectedProcedure
    .input(GetEventInputSchema.transform(data => ({ eventId: data.id })))
    .query(async ({ input, ctx }) => {
      return await getEventEditPageData(input.eventId, ctx.userId);
    }),

  /**
   * Get change date page data
   * Returns: [error, EventChangeDatePageData] tuple
   */
  getChangeDatePageData: protectedProcedure
    .input(GetEventInputSchema.transform(data => ({ eventId: data.id })))
    .query(async ({ input, ctx }) => {
      return await getEventChangeDatePageData(input.eventId, ctx.userId);
    }),

  /**
   * Get change date single page data
   * Returns: [error, EventChangeDateSinglePageData] tuple
   */
  getChangeDateSinglePageData: protectedProcedure
    .input(GetEventInputSchema.transform(data => ({ eventId: data.id })))
    .query(async ({ input, ctx }) => {
      return await getEventChangeDateSinglePageData(input.eventId, ctx.userId);
    }),

  /**
   * Get change date multi page data
   * Returns: [error, EventChangeDateMultiPageData] tuple
   */
  getChangeDateMultiPageData: protectedProcedure
    .input(GetEventInputSchema.transform(data => ({ eventId: data.id })))
    .query(async ({ input, ctx }) => {
      return await getEventChangeDateMultiPageData(input.eventId, ctx.userId);
    }),
});

export type EventRouter = typeof eventRouter;
