import { z } from 'zod';
import { RoleSchema } from '../generated';
import { DateOptionDTO } from './availability';
import type { ResultTuple } from '../result-tuple';

// ============================================================================
// EVENT DATE SELECT PAGE SCHEMAS
// ============================================================================

// Main data structure for Event Date Select page (same as availability but organizer-only)
export const EventDateSelectPageDataSchema = z.object({
  potentialDateTimes: z.array(DateOptionDTO),
  userRole: RoleSchema,
  userId: z.string(),
});

// Error types
export const EventDateSelectPageErrorSchema = z.discriminatedUnion('_tag', [
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
    _tag: z.literal('UnauthorizedError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('DatabaseError'),
    message: z.string(),
  }),
]);

// Type exports
export type EventDateSelectPageData = z.infer<
  typeof EventDateSelectPageDataSchema
>;
export type EventDateSelectPageError = z.infer<
  typeof EventDateSelectPageErrorSchema
>;
export type EventDateSelectPageResult = ResultTuple<
  EventDateSelectPageError,
  EventDateSelectPageData
>;
