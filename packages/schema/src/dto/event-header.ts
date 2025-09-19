import { z } from 'zod';
import {
  EventSchema,
  MembershipSchema,
  RoleSchema,
  StatusSchema,
} from '../generated';
import { createResultTuple } from '../result-tuple';

// ============================================================================
// EVENT HEADER COMPONENT SCHEMAS
// ============================================================================

/**
 * Schema for the EventHeader component data
 * Contains only the fields needed for the event header display
 * Based on generated Prisma schemas
 */
export const EventHeaderDataSchema = z.object({
  event: EventSchema.pick({
    id: true,
    title: true,
    description: true,
    location: true,
    chosenDateTime: true,
  }),
  userMembership: MembershipSchema.pick({
    id: true,
    role: true,
    rsvpStatus: true,
  }),
});

export type EventHeaderData = z.infer<typeof EventHeaderDataSchema>;

// ============================================================================
// ERROR TYPES
// ============================================================================

export const EventHeaderErrorSchema = z.discriminatedUnion('_tag', [
  z.object({
    _tag: z.literal('EventNotFoundError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('EventUserNotFoundError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('EventUserNotMemberError'),
    message: z.string(),
  }),
]);

export type EventHeaderError = z.infer<typeof EventHeaderErrorSchema>;

// ============================================================================
// RESULT TUPLE - Discriminated Union (Error OR Data, never both, never neither)
// ============================================================================

export const EventHeaderResultSchema = createResultTuple(
  EventHeaderErrorSchema,
  EventHeaderDataSchema
);

export type EventHeaderResult = z.infer<typeof EventHeaderResultSchema>;
