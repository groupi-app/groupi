import { z } from 'zod';
import { EventSchema, InviteSchema, PersonSchema } from '../generated';
import type { ResultTuple } from '../result-tuple';

// ============================================================================
// EVENT INVITE PAGE SCHEMAS
// ============================================================================

// Invite data for display
export const EventInvitePageInviteSchema = InviteSchema.pick({
  id: true,
  name: true,
  expiresAt: true,
  usesRemaining: true,
  maxUses: true,
  createdAt: true,
}).extend({
  createdByName: z.string(),
});

// Event data for the invite page
export const EventInvitePageEventSchema = EventSchema.pick({
  id: true,
  title: true,
});

// Main data structure for Event Invite page
export const EventInvitePageDataSchema = z.object({
  event: EventInvitePageEventSchema,
  invites: z.array(EventInvitePageInviteSchema),
});

// Error types
export const EventInvitePageErrorSchema = z.discriminatedUnion('_tag', [
  z.object({
    _tag: z.literal('EventNotFoundError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('EventUserNotMemberError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('UnauthorizedError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('DatabaseError'),
    message: z.string(),
  }),
]);

// Type exports
export type EventInvitePageData = z.infer<typeof EventInvitePageDataSchema>;
export type EventInvitePageError = z.infer<typeof EventInvitePageErrorSchema>;
export type EventInvitePageResult = ResultTuple<
  EventInvitePageError,
  EventInvitePageData
>;
