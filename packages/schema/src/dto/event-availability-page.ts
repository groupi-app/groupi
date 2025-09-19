import { z } from 'zod';
import { RoleSchema } from '../generated';
import { DateOptionDTO } from './availability';
import type { ResultTuple } from '../result-tuple';

// ============================================================================
// EVENT AVAILABILITY PAGE SCHEMAS
// ============================================================================

// Main data structure for Event Availability page
export const EventAvailabilityPageDataSchema = z.object({
  potentialDateTimes: z.array(DateOptionDTO),
  userRole: RoleSchema,
  userId: z.string(),
});

// Error types
export const EventAvailabilityPageErrorSchema = z.discriminatedUnion('_tag', [
  z.object({
    _tag: z.literal('AvailabilityNotFoundError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('AvailabilityEventNotFoundError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('AvailabilityUserNotMemberError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('UnauthorizedAvailabilityError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('DatabaseError'),
    message: z.string(),
  }),
]);

// Type exports
export type EventAvailabilityPageData = z.infer<
  typeof EventAvailabilityPageDataSchema
>;
export type EventAvailabilityPageError = z.infer<
  typeof EventAvailabilityPageErrorSchema
>;
export type EventAvailabilityPageResult = ResultTuple<
  EventAvailabilityPageError,
  EventAvailabilityPageData
>;
