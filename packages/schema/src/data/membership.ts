/* eslint-disable no-redeclare */
import { z } from 'zod';
import { EventSchema, MembershipSchema, UserSchema } from '../generated';

// ============================================================================
// MEMBERSHIP DOMAIN DATA TYPES
// ============================================================================

// Basic membership data
export const MembershipData = MembershipSchema.pick({
  id: true,
  personId: true,
  eventId: true,
  role: true,
  rsvpStatus: true,
});

export type MembershipData = z.infer<typeof MembershipData>;

// Membership with person details
export const MembershipWithPersonData = MembershipSchema.pick({
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
    }),
  }),
});

export type MembershipWithPersonData = z.infer<typeof MembershipWithPersonData>;

// Member list data - for attendees pages
export const MemberListData = z.array(MembershipWithPersonData);
export type MemberListData = z.infer<typeof MemberListData>;

// Member list page data
export const MemberListPageData = z.object({
  event: EventSchema.pick({
    id: true,
    chosenDateTime: true,
  }).extend({
    memberships: z.array(MembershipWithPersonData),
  }),
  userMembership: MembershipSchema.pick({
    id: true,
    role: true,
  }),
  userId: z.string(),
});

export type MemberListPageData = z.infer<typeof MemberListPageData>;
