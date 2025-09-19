import { z } from 'zod';
import {
  PersonSchema,
  EventSchema,
  MembershipSchema,
} from '../generated';
import { createResultTuple } from '../result-tuple';

// ============================================================================
// EVENT LIST COMPONENT SCHEMAS
// ============================================================================

/**
 * Schema for the EventList component
 * Contains user data with their event memberships
 * Based on generated Prisma schemas
 */
export const EventListDataSchema = z.object({
  person: PersonSchema.pick({
    id: true,
    firstName: true,
    lastName: true,
    username: true,
    imageUrl: true,
  }).extend({
    memberships: z.array(
      MembershipSchema.pick({
        id: true,
        role: true,
        rsvpStatus: true,
      }).extend({
        event: EventSchema.pick({
          id: true,
          title: true,
          description: true,
          location: true,
          chosenDateTime: true,
          createdAt: true,
        }),
      })
    ),
  }),
});

export type EventListData = z.infer<typeof EventListDataSchema>;

// ============================================================================
// ERROR TYPES
// ============================================================================

export const EventListErrorSchema = z.discriminatedUnion('_tag', [
  z.object({
    _tag: z.literal('PersonNotFoundError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('PersonUserNotFoundError'),
    message: z.string(),
  }),
]);

export type EventListError = z.infer<typeof EventListErrorSchema>;

// ============================================================================
// RESULT TUPLE - Discriminated Union (Error OR Data, never both, never neither)
// ============================================================================

export const EventListResultSchema = createResultTuple(
  EventListErrorSchema,
  EventListDataSchema
);

export type EventListResult = z.infer<typeof EventListResultSchema>;
