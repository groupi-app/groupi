import { z } from 'zod';
import { EventSchema, MembershipSchema } from '../generated';
import type { ResultTuple } from '../result-tuple';

// ============================================================================
// EVENT CHANGE DATE SINGLE PAGE SCHEMAS
// ============================================================================

// Event data for the change date single page
export const EventChangeDateSingleEventSchema = EventSchema.pick({
  id: true,
  title: true,
  chosenDateTime: true,
});

// Main data structure for Event Change Date Single page
export const EventChangeDateSinglePageDataSchema = z.object({
  event: EventChangeDateSingleEventSchema,
  userRole: MembershipSchema.shape.role,
});

// Error types
export const EventChangeDateSinglePageErrorSchema = z.discriminatedUnion(
  '_tag',
  [
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
  ]
);

// Type exports
export type EventChangeDateSinglePageData = z.infer<
  typeof EventChangeDateSinglePageDataSchema
>;
export type EventChangeDateSinglePageError = z.infer<
  typeof EventChangeDateSinglePageErrorSchema
>;
export type EventChangeDateSinglePageResult = ResultTuple<
  EventChangeDateSinglePageError,
  EventChangeDateSinglePageData
>;
