import { z } from '@hono/zod-openapi';
import {
  AvailabilityStatusSchema,
  UserSummarySchema,
  TimestampSchema,
} from './common';

/**
 * Availability-related API schemas
 */

// For submitting availability (only YES/MAYBE/NO allowed, not PENDING)
const AvailabilitySubmitStatusSchema = z.enum(['YES', 'MAYBE', 'NO']).openapi({
  example: 'YES',
  description: 'Availability status to submit (PENDING is not allowed)',
});

// Potential date time with availability votes
export const PotentialDateTimeSchema = z
  .object({
    id: z.string(),
    dateTime: TimestampSchema,
    endDateTime: TimestampSchema.nullable(),
  })
  .openapi('PotentialDateTime');

// User availability for a specific date
export const UserAvailabilitySchema = z
  .object({
    membershipId: z.string(),
    user: UserSummarySchema,
    status: AvailabilityStatusSchema,
  })
  .openapi('UserAvailability');

// Availability grid entry (date + all votes)
export const AvailabilityGridEntrySchema = z
  .object({
    potentialDateTime: PotentialDateTimeSchema,
    availabilities: z.array(UserAvailabilitySchema),
    summary: z.object({
      yes: z.number().int(),
      maybe: z.number().int(),
      no: z.number().int(),
      pending: z.number().int(),
    }),
  })
  .openapi('AvailabilityGridEntry');

// Full availability grid response
export const AvailabilityGridResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      eventId: z.string(),
      potentialDates: z.array(AvailabilityGridEntrySchema),
      userMembershipId: z.string(),
    }),
  })
  .openapi('AvailabilityGridResponse');

// Submit availability request body
export const SubmitAvailabilityRequestSchema = z
  .object({
    responses: z.array(
      z.object({
        potentialDateTimeId: z.string(),
        status: AvailabilitySubmitStatusSchema,
      })
    ),
  })
  .openapi('SubmitAvailabilityRequest');

// Submit availability response
export const SubmitAvailabilityResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      updated: z.number().int(),
      created: z.number().int(),
    }),
  })
  .openapi('SubmitAvailabilityResponse');

// Potential dates list response
export const PotentialDatesResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(PotentialDateTimeSchema),
  })
  .openapi('PotentialDatesResponse');
