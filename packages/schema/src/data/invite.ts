/* eslint-disable no-redeclare */
import { z } from 'zod';
import {
  InviteSchema,
  EventSchema,
  MembershipSchema,
  UserSchema,
} from '../generated';

// ============================================================================
// INVITE DOMAIN DATA DTOS
// ============================================================================

// Basic invite DTO
export const InviteDTO = InviteSchema.pick({
  id: true,
  name: true,
  eventId: true,
  createdById: true,
  expiresAt: true,
  usesRemaining: true,
  maxUses: true,
  createdAt: true,
});

export type InviteDTO = z.infer<typeof InviteDTO>;

// Event invite DTO - for individual invite entries in invite lists
export const EventInviteDTO = InviteDTO.extend({
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

export type EventInviteDTO = z.infer<typeof EventInviteDTO>;

// Event invite management DTO - for invite management page showing all invites
export const EventInviteManagementDTO = EventSchema.pick({
  id: true,
  title: true,
  description: true,
  location: true,
  chosenDateTime: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  invites: z.array(EventInviteDTO),
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

export type EventInviteManagementDTO = z.infer<typeof EventInviteManagementDTO>;

// Individual invite page DTO - for showing invite details with full event info
export const IndividualInviteDTO = EventInviteDTO.extend({
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

export type IndividualInviteDTO = z.infer<typeof IndividualInviteDTO>;

// ============================================================================
// PAGE-SPECIFIC DATA TYPES
// ============================================================================

// Invite page DTO
export const InvitePageDTO = IndividualInviteDTO;
export type InvitePageDTO = z.infer<typeof InvitePageDTO>;

// Event invite page DTO
export const EventInvitePageDTO = EventInviteManagementDTO;
export type EventInvitePageDTO = z.infer<typeof EventInvitePageDTO>;
