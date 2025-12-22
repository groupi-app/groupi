/* eslint-disable no-redeclare */
import { z } from 'zod';
import {
  InviteSchema,
  EventSchema,
  MembershipSchema,
  UserSchema,
} from '../generated';

// ============================================================================
// INVITE DOMAIN DATA TYPES
// ============================================================================

// Basic invite data
export const InviteData = InviteSchema.pick({
  id: true,
  name: true,
  eventId: true,
  createdById: true,
  expiresAt: true,
  usesRemaining: true,
  maxUses: true,
  createdAt: true,
});

export type InviteData = z.infer<typeof InviteData>;

// Event invite data - for individual invite entries in invite lists
export const EventInviteData = InviteData.extend({
  createdBy: MembershipSchema.pick({
    id: true,
  }).extend({
    person: z.object({
      id: z.string(),
      user: UserSchema.pick({
        name: true,
        email: true,
        image: true,
      }),
    }),
  }),
});

export type EventInviteData = z.infer<typeof EventInviteData>;

// Event invite management data - for invite management page showing all invites
export const EventInviteManagementData = EventSchema.pick({
  id: true,
  title: true,
  description: true,
  location: true,
  chosenDateTime: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  invites: z.array(EventInviteData),
  memberships: z.array(
    MembershipSchema.pick({
      id: true,
      role: true,
      rsvpStatus: true,
      personId: true,
      eventId: true,
    })
  ),
});

export type EventInviteManagementData = z.infer<
  typeof EventInviteManagementData
>;

// Individual invite page data - for showing invite details with full event info
export const IndividualInviteData = EventInviteData.extend({
  event: EventSchema.pick({
    id: true,
    title: true,
    description: true,
    location: true,
    chosenDateTime: true,
  }).extend({
    memberCount: z.number(),
  }),
});

export type IndividualInviteData = z.infer<typeof IndividualInviteData>;

// ============================================================================
// PAGE-SPECIFIC DATA TYPES
// ============================================================================

// Invite page data
export const InvitePageData = IndividualInviteData;
export type InvitePageData = z.infer<typeof InvitePageData>;

// Event invite page data
export const EventInvitePageData = EventInviteManagementData;
export type EventInvitePageData = z.infer<typeof EventInvitePageData>;
