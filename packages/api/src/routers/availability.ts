import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '@groupi/services';
import {
  // Import safe-wrapper service functions
  getEventPotentialDateTimes,
  updateMembershipAvailabilities,
  chooseDateTime,
  // Import component-specific services
  getEventAvailabilityPageData,
  getEventDateSelectPageData,
} from '@groupi/services';

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const GetEventPotentialDateTimesSchema = z.object({
  eventId: z.string(),
});

const UpdateMembershipAvailabilitiesSchema = z.object({
  eventId: z.string(),
  availabilityUpdates: z
    .array(
      z.object({
        potentialDateTimeId: z.string(),
        status: z.enum(['YES', 'NO', 'MAYBE']),
      })
    )
    .min(1, 'At least one availability update is required'),
});

const ChooseDateTimeSchema = z.object({
  eventId: z.string(),
  pdtId: z.string(),
});

// ============================================================================
// AVAILABILITY ROUTER
// ============================================================================

export const availabilityRouter = createTRPCRouter({
  /**
   * Granular: current user's availability statuses for an event's PDTs
   */
  getMyAvailabilities: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      const membership = await db.membership.findFirst({
        where: { personId: ctx.userId, eventId: input.eventId },
        select: { id: true },
      });
      if (!membership) return [new Error('Unauthorized'), null] as const;
      const statuses = await db.availability.findMany({
        where: { membershipId: membership.id },
        select: { potentialDateTimeId: true, status: true },
      });
      return [null, statuses] as const;
    }),
  /**
   * Get event potential date times with availability data
   * Returns: [error, { potentialDateTimes, userId, userRole }] tuple
   */
  getEventPotentialDateTimes: protectedProcedure
    .input(GetEventPotentialDateTimesSchema)
    .query(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await getEventPotentialDateTimes(input.eventId, ctx.userId);
    }),

  /**
   * Update user's availability for potential date times
   * Returns: [error, { message }] tuple
   */
  updateAvailabilities: protectedProcedure
    .input(UpdateMembershipAvailabilitiesSchema)
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await updateMembershipAvailabilities(
        input.eventId,
        input.availabilityUpdates,
        ctx.userId
      );
    }),

  /**
   * Choose the final date/time for an event (organizer only)
   * Returns: [error, { message }] tuple
   */
  chooseDateTime: protectedProcedure
    .input(ChooseDateTimeSchema)
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await chooseDateTime(input.eventId, input.pdtId, ctx.userId);
    }),

  // ============================================================================
  // COMPONENT-SPECIFIC DATA ENDPOINTS
  // ============================================================================

  /**
   * Get availability page data
   * Returns: [error, EventAvailabilityPageData] tuple
   */
  getAvailabilityPageData: protectedProcedure
    .input(GetEventPotentialDateTimesSchema)
    .query(async ({ input, ctx }) => {
      return await getEventAvailabilityPageData(input.eventId, ctx.userId);
    }),

  /**
   * Get date select page data (organizer-only)
   * Returns: [error, EventDateSelectPageData] tuple
   */
  getDateSelectPageData: protectedProcedure
    .input(GetEventPotentialDateTimesSchema)
    .query(async ({ input, ctx }) => {
      return await getEventDateSelectPageData(input.eventId, ctx.userId);
    }),
});

export type AvailabilityRouter = typeof availabilityRouter;
