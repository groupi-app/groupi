import { z } from 'zod';
import { EventSchema, MembershipSchema, PersonSchema } from '../generated';
import type { ResultTuple } from '../result-tuple';

// ============================================================================
// EVENT ATTENDEES PAGE SCHEMAS
// ============================================================================

// Person data for attendee display
export const EventAttendeesPersonSchema = PersonSchema.pick({
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  imageUrl: true,
});

// Membership data with person for attendee list
export const EventAttendeesMembershipSchema = MembershipSchema.pick({
  id: true,
  role: true,
  rsvpStatus: true,
  personId: true,
  eventId: true,
}).extend({
  person: EventAttendeesPersonSchema,
});

// Event data for the attendees page
export const EventAttendeesEventSchema = EventSchema.pick({
  id: true,
  title: true,
  chosenDateTime: true,
}).extend({
  memberships: z.array(EventAttendeesMembershipSchema),
});

// Main data structure for Event Attendees page
export const EventAttendeesPageDataSchema = z.object({
  event: EventAttendeesEventSchema,
});

// Error types
export const EventAttendeesPageErrorSchema = z.discriminatedUnion('_tag', [
  z.object({
    _tag: z.literal('EventNotFoundError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('EventUserNotMemberError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('DatabaseError'),
    message: z.string(),
  }),
]);

// Type exports
export type EventAttendeesPageData = z.infer<
  typeof EventAttendeesPageDataSchema
>;
export type EventAttendeesPageError = z.infer<
  typeof EventAttendeesPageErrorSchema
>;
export type EventAttendeesPageResult = ResultTuple<
  EventAttendeesPageError,
  EventAttendeesPageData
>;
