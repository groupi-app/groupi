import { z } from 'zod';
import {
  EventSchema,
  MembershipSchema,
  PotentialDateTimeSchema,
} from '../generated';
import type { ResultTuple } from '../result-tuple';

// ============================================================================
// EVENT CHANGE DATE MULTI PAGE SCHEMAS
// ============================================================================

// Event data for the change date multi page
export const EventChangeDateMultiEventSchema = EventSchema.pick({
  id: true,
  title: true,
}).extend({
  potentialDateTimes: z
    .array(
      PotentialDateTimeSchema.pick({
        id: true,
        dateTime: true,
      })
    )
    .optional(),
});

// Main data structure for Event Change Date Multi page
export const EventChangeDateMultiPageDataSchema = z.object({
  event: EventChangeDateMultiEventSchema,
  userRole: MembershipSchema.shape.role,
});

// Error types
export const EventChangeDateMultiPageErrorSchema = z.discriminatedUnion(
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
export type EventChangeDateMultiPageData = z.infer<
  typeof EventChangeDateMultiPageDataSchema
>;
export type EventChangeDateMultiPageError = z.infer<
  typeof EventChangeDateMultiPageErrorSchema
>;
export type EventChangeDateMultiPageResult = ResultTuple<
  EventChangeDateMultiPageError,
  EventChangeDateMultiPageData
>;
