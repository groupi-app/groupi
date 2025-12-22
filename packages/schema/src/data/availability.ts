/* eslint-disable no-redeclare */
import { z } from 'zod';
import {
  AvailabilitySchema,
  PotentialDateTimeSchema,
  MembershipSchema,
  UserSchema,
} from '../generated';

// ============================================================================
// AVAILABILITY DOMAIN DATA TYPES
// ============================================================================

// Basic availability data
export const AvailabilityData = AvailabilitySchema.pick({
  membershipId: true,
  potentialDateTimeId: true,
  status: true,
});

export type AvailabilityData = z.infer<typeof AvailabilityData>;

// Potential date time data
export const PotentialDateTimeData = PotentialDateTimeSchema.pick({
  id: true,
  eventId: true,
  dateTime: true,
});

export type PotentialDateTimeData = z.infer<typeof PotentialDateTimeData>;

// Date option data - represents a potential date/time with availability info
export const DateOptionData = PotentialDateTimeData.extend({
  availabilities: z.array(
    AvailabilitySchema.pick({
      status: true,
    }).extend({
      membership: MembershipSchema.pick({
        id: true,
        personId: true,
        eventId: true,
        role: true,
        rsvpStatus: true,
      }).extend({
        person: z.object({
          id: z.string(),
          user: UserSchema.pick({
            name: true,
            email: true,
            image: true,
            username: true,
          }),
        }),
      }),
    })
  ),
});

export type DateOptionData = z.infer<typeof DateOptionData>;

// Availability data - for availability pages showing potential date times with availability info
export const AvailabilityPageData = z.object({
  potentialDateTimes: z.array(DateOptionData),
  userRole: MembershipSchema.shape.role,
  userId: z.string(),
});

export type AvailabilityPageData = z.infer<typeof AvailabilityPageData>;
