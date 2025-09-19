import { z } from 'zod';
import { EventSchema, MembershipSchema } from '../generated';
import type { ResultTuple } from '../result-tuple';

// ============================================================================
// EVENT CHANGE DATE PAGE SCHEMAS
// ============================================================================

// Event data for the change date page
export const EventChangeDateEventSchema = EventSchema.pick({
  id: true,
  title: true,
});

// Main data structure for Event Change Date page
export const EventChangeDatePageDataSchema = z.object({
  event: EventChangeDateEventSchema,
  userRole: MembershipSchema.shape.role,
});

// Error types
export const EventChangeDatePageErrorSchema = z.discriminatedUnion('_tag', [
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
export type EventChangeDatePageData = z.infer<
  typeof EventChangeDatePageDataSchema
>;
export type EventChangeDatePageError = z.infer<
  typeof EventChangeDatePageErrorSchema
>;
export type EventChangeDatePageResult = ResultTuple<
  EventChangeDatePageError,
  EventChangeDatePageData
>;
