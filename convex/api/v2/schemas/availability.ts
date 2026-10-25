import { z, extendZodWithOpenApi } from '@hono/zod-openapi';
extendZodWithOpenApi(z);
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
    note: z.string().nullable(),
  })
  .openapi('PotentialDateTime');

// User availability for a specific date
export const UserAvailabilitySchema = z
  .object({
    membershipId: z.string(),
    user: UserSummarySchema,
    status: AvailabilityStatusSchema,
    note: z.string().nullable(),
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
    eventId: z.string(),
    potentialDates: z.array(AvailabilityGridEntrySchema),
    userMembershipId: z.string(),
  })
  .openapi('AvailabilityGridResponse');

// Submit availability request body
export const SubmitAvailabilityRequestSchema = z
  .object({
    responses: z
      .array(
        z
          .object({
            potentialDateTimeId: z.string(),
            status: AvailabilitySubmitStatusSchema,
            note: z.string().max(200).optional(),
          })
          .strict()
      )
      .max(8192),
  })
  .strict()
  .refine(
    ({ responses }) =>
      new Set(responses.map(response => response.potentialDateTimeId)).size ===
      responses.length,
    {
      message:
        'Each potential date time can only appear once per availability submission',
      path: ['responses'],
    }
  )
  .openapi('SubmitAvailabilityRequest');

// Submit availability response
export const SubmitAvailabilityResponseSchema = z
  .object({
    updated: z.number().int(),
    created: z.number().int(),
  })
  .openapi('SubmitAvailabilityResponse');

// Potential dates list response
export const PotentialDatesResponseSchema = z
  .array(PotentialDateTimeSchema)
  .openapi('PotentialDatesResponse');

export const PotentialDatesPageSchema = z.object({
  items: z.array(PotentialDateTimeSchema),
  nextCursor: z.string().nullable(),
});
export const OwnAvailabilityPageSchema = z.object({
  items: z.array(
    z.object({
      potentialDateTime: PotentialDateTimeSchema,
      status: AvailabilityStatusSchema,
      note: z.string().nullable(),
      availabilityId: z.string().nullable(),
    })
  ),
  nextCursor: z.string().nullable(),
});
export const AvailabilityResponsesPageSchema = z.object({
  items: z.array(
    z.object({
      membershipId: z.string(),
      personId: z.string(),
      user: UserSummarySchema.nullable(),
      status: AvailabilityStatusSchema,
      note: z.string().nullable(),
    })
  ),
  nextCursor: z.string().nullable(),
});
export const ChooseDateSchema = z.discriminatedUnion('selectionSource', [
  z
    .object({
      selectionSource: z.literal('POLL'),
      potentialDateTimeId: z.string().min(1),
    })
    .strict(),
  z
    .object({
      selectionSource: z.literal('MANUAL'),
      chosenDateTime: z.string().datetime({ offset: true }),
      chosenEndDateTime: z.string().datetime({ offset: true }).optional(),
    })
    .strict(),
]);
