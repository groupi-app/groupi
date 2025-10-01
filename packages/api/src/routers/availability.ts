import { createTRPCRouter, protectedProcedure } from '../trpc';
import {
  // Import param schemas
  GetEventPotentialDateTimesParams,
  GetMyAvailabilitiesParams,
} from '@groupi/schema/params';
import {
  // Import service functions
  getEventPotentialDateTimes,
  updateMemberAvailabilities,
  chooseDateTime,
  getMyAvailabilities,
} from '@groupi/services';
import { z } from 'zod';

// ============================================================================
// AVAILABILITY ROUTER
// ============================================================================

export const availabilityRouter = createTRPCRouter({
  /**
   * Granular: current user's availability statuses for an event's PDTs
   */
  getMyAvailabilities: protectedProcedure
    .input(GetMyAvailabilitiesParams)
    .query(async ({ input }) => {
      return await getMyAvailabilities({
        eventId: input.eventId,
      });
    }),
  /**
   * Get event potential date times with availability data
   * Returns: [error, { potentialDateTimes, userId, userRole }] tuple
   */
  getEventPotentialDateTimes: protectedProcedure
    .input(GetEventPotentialDateTimesParams)
    .query(async ({ input }) => {
      return await getEventPotentialDateTimes({
        eventId: input.eventId,
      });
    }),

  /**
   * Update user's availability for potential date times
   * Returns: [error, { message }] tuple
   */
  updateAvailabilities: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        availabilityUpdates: z
          .array(
            z.object({
              potentialDateTimeId: z.string(),
              status: z.enum(['YES', 'NO', 'MAYBE']),
            })
          )
          .min(1, 'At least one availability update is required'),
      })
    )
    .mutation(async ({ input }) => {
      return await updateMemberAvailabilities({
        eventId: input.eventId,
        availabilities: input.availabilityUpdates.map(update => ({
          potentialDateTimeId: update.potentialDateTimeId,
          status: update.status,
        })),
      });
    }),

  /**
   * Choose the final date/time for an event (organizer only)
   * Returns: [error, { message }] tuple
   */
  chooseDateTime: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        pdtId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await chooseDateTime({
        eventId: input.eventId,
        potentialDateTimeId: input.pdtId,
      });
    }),
});

export type AvailabilityRouter = typeof availabilityRouter;
