/* eslint-disable no-redeclare */
import { z } from 'zod';
import { EventSchema, MembershipSchema, PersonSchema } from '../generated';

// ============================================================================
// MEMBERSHIP DOMAIN DATA DTOS
// ============================================================================

// Basic membership DTO
export const MembershipDTO = MembershipSchema.pick({
  id: true,
  personId: true,
  eventId: true,
  role: true,
  rsvpStatus: true,
});

export type MembershipDTO = z.infer<typeof MembershipDTO>;

// Membership with person details
export const MembershipWithPersonDTO = MembershipSchema.pick({
  id: true,
  personId: true,
  eventId: true,
  role: true,
  rsvpStatus: true,
}).extend({
  person: PersonSchema.pick({
    id: true,
    firstName: true,
    lastName: true,
    username: true,
    imageUrl: true,
  }),
});

export type MembershipWithPersonDTO = z.infer<typeof MembershipWithPersonDTO>;

// Member list DTO - for attendees pages
export const MemberListDTO = z.array(MembershipWithPersonDTO);
export type MemberListDTO = z.infer<typeof MemberListDTO>;

// Member list page DTO
export const MemberListPageDTO = z.object({
  event: EventSchema.pick({
    id: true,
    chosenDateTime: true,
  }).extend({
    memberships: z.array(MembershipWithPersonDTO),
  }),
  userMembership: MembershipSchema.pick({
    id: true,
    role: true,
  }),
  userId: PersonSchema.shape.id,
});

export type MemberListPageDTO = z.infer<typeof MemberListPageDTO>;
