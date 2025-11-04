/* eslint-disable no-redeclare */
import { z } from 'zod';
import {
  EventSchema,
  AvailabilitySchema,
  PotentialDateTimeSchema,
} from '../generated';

// ============================================================================
// AVAILABILITY DOMAIN PARAMETER SCHEMAS
// ============================================================================

// Get my availabilities parameters
export const GetMyAvailabilitiesParams = z.object({
  eventId: EventSchema.shape.id,
});

export type GetMyAvailabilitiesParams = z.infer<
  typeof GetMyAvailabilitiesParams
>;

// Get event potential date times parameters
export const GetEventPotentialDateTimesParams = z.object({
  eventId: EventSchema.shape.id,
});

export type GetEventPotentialDateTimesParams = z.infer<
  typeof GetEventPotentialDateTimesParams
>;

// Update member availabilities parameters
export const UpdateMemberAvailabilitiesParams = z.object({
  eventId: EventSchema.shape.id,
  availabilities: z.array(
    AvailabilitySchema.pick({
      potentialDateTimeId: true,
    }).extend({
      status: AvailabilitySchema.shape.status.exclude(['PENDING']),
    })
  ),
});

export type UpdateMemberAvailabilitiesParams = z.infer<
  typeof UpdateMemberAvailabilitiesParams
>;

// Choose date time parameters
export const ChooseDateTimeParams = z.object({
  eventId: EventSchema.shape.id,
  potentialDateTimeId: PotentialDateTimeSchema.shape.id,
});

export type ChooseDateTimeParams = z.infer<typeof ChooseDateTimeParams>;
