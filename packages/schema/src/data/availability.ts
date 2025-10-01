/* eslint-disable no-redeclare */
import { z } from 'zod';
import {
  AvailabilitySchema,
  PotentialDateTimeSchema,
  MembershipSchema,
  PersonSchema,
  EventSchema,
} from '../generated';

// ============================================================================
// AVAILABILITY DOMAIN DATA DTOS
// ============================================================================

// Basic availability DTO
export const AvailabilityDTO = AvailabilitySchema.pick({
  membershipId: true,
  potentialDateTimeId: true,
  status: true,
});

export type AvailabilityDTO = z.infer<typeof AvailabilityDTO>;

// Potential date time DTO
export const PotentialDateTimeDTO = PotentialDateTimeSchema.pick({
  id: true,
  eventId: true,
  dateTime: true,
});

export type PotentialDateTimeDTO = z.infer<typeof PotentialDateTimeDTO>;

// Date option DTO - represents a potential date/time with availability info
export const DateOptionDTO = PotentialDateTimeDTO.extend({
  availabilities: z.array(
    AvailabilitySchema.pick({
      status: true,
    }).extend({
      membership: MembershipSchema.pick({
        id: true,
        personId: true,
      }).extend({
        person: PersonSchema.pick({
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          imageUrl: true,
        }),
      }),
    })
  ),
});

export type DateOptionDTO = z.infer<typeof DateOptionDTO>;

// PDT (Potential Date Time) DTO - for availability pages
export const PDTDTO = z.object({
  potentialDateTimes: z.array(DateOptionDTO),
  userRole: MembershipSchema.shape.role,
  userId: z.string(),
});

export type PDTDTO = z.infer<typeof PDTDTO>;

// Event availability page DTO
export const EventAvailabilityPageDTO = z.object({
  event: EventSchema.pick({
    id: true,
    title: true,
    chosenDateTime: true,
  }),
  potentialDateTimes: z.array(DateOptionDTO),
  userMembership: MembershipSchema.pick({
    id: true,
    role: true,
  }),
});

export type EventAvailabilityPageDTO = z.infer<typeof EventAvailabilityPageDTO>;

// Date selection page DTO
export const DateSelectionPageDTO = z.object({
  event: EventSchema.pick({
    id: true,
    title: true,
  }),
  potentialDateTimes: z.array(
    PotentialDateTimeDTO.extend({
      availabilityCount: AvailabilitySchema.pick({
        status: true,
      }),
    })
  ),
  userRole: MembershipSchema.pick({
    role: true,
  }),
});

export type DateSelectionPageDTO = z.infer<typeof DateSelectionPageDTO>;
