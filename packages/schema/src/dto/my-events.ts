import { z } from 'zod';
import { EventSchema, MembershipSchema, PersonSchema } from '../generated';
import type { ResultTuple } from '../result-tuple';

// ============================================================================
// MY EVENTS PAGE SCHEMAS
// ============================================================================

// Define the exact shape of event data for MyEvents page
export const MyEventsEventSchema = EventSchema.pick({
  id: true,
  title: true,
  description: true,
  location: true,
  chosenDateTime: true,
  createdAt: true,
  updatedAt: true,
});

// Membership with role for filtering owned events
export const MyEventsMembershipSchema = MembershipSchema.pick({
  id: true,
  personId: true,
  role: true,
  rsvpStatus: true,
});

// Person data for member display
export const MyEventsPersonSchema = PersonSchema.pick({
  id: true,
  name: true,
  profilePhoto: true,
});

// Event with memberships for the list
export const MyEventsEventWithMembershipsSchema = MyEventsEventSchema.extend({
  memberships: z.array(
    MyEventsMembershipSchema.extend({
      person: MyEventsPersonSchema,
    })
  ),
});

// Main data structure for MyEvents page
export const MyEventsDataSchema = z.object({
  memberships: z.array(
    z.object({
      event: MyEventsEventWithMembershipsSchema,
    })
  ),
});

// Error types
export const MyEventsErrorSchema = z.discriminatedUnion('_tag', [
  z.object({
    _tag: z.literal('UserNotFoundError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('DatabaseError'),
    message: z.string(),
  }),
]);

// Type exports
export type MyEventsData = z.infer<typeof MyEventsDataSchema>;
export type MyEventsError = z.infer<typeof MyEventsErrorSchema>;
export type MyEventsResult = ResultTuple<MyEventsError, MyEventsData>;
