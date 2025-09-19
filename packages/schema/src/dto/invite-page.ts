import { z } from 'zod';
import {
  InviteSchema,
  EventSchema,
  MembershipSchema,
  PersonSchema,
} from '../generated';
import type { ResultTuple } from '../result-tuple';

// ============================================================================
// INVITE PAGE SCHEMAS
// ============================================================================

// Define the exact shape of invite data for Invite page
export const InvitePageInviteSchema = InviteSchema.pick({
  id: true,
  name: true,
  eventId: true,
  createdById: true,
  expiresAt: true,
  usesRemaining: true,
  maxUses: true,
  createdAt: true,
});

// Event data for invite display
export const InvitePageEventSchema = EventSchema.pick({
  id: true,
  title: true,
  description: true,
  location: true,
  chosenDateTime: true,
});

// Creator membership data
export const InvitePageCreatorSchema = z.object({
  id: z.string(),
  person: PersonSchema.pick({
    id: true,
    name: true,
    profilePhoto: true,
  }),
});

// Main data structure for Invite page
export const InvitePageDataSchema = InvitePageInviteSchema.extend({
  event: InvitePageEventSchema.extend({
    memberCount: z.number(),
  }),
  createdBy: InvitePageCreatorSchema,
});

// Error types
export const InvitePageErrorSchema = z.discriminatedUnion('_tag', [
  z.object({
    _tag: z.literal('InviteNotFoundError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('InviteExpiredError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('InviteNoUsesError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('DatabaseError'),
    message: z.string(),
  }),
]);

// Type exports
export type InvitePageData = z.infer<typeof InvitePageDataSchema>;
export type InvitePageError = z.infer<typeof InvitePageErrorSchema>;
export type InvitePageResult = ResultTuple<InvitePageError, InvitePageData>;
