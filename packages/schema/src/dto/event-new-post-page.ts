import { z } from 'zod';
import { EventSchema, MembershipSchema } from '../generated';
import type { ResultTuple } from '../result-tuple';

// ============================================================================
// EVENT NEW POST PAGE SCHEMAS
// ============================================================================

// Event data for the new post page
export const EventNewPostEventSchema = EventSchema.pick({
  id: true,
  title: true,
});

// Main data structure for Event New Post page
export const EventNewPostPageDataSchema = z.object({
  event: EventNewPostEventSchema,
  userRole: MembershipSchema.shape.role,
});

// Error types
export const EventNewPostPageErrorSchema = z.discriminatedUnion('_tag', [
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
export type EventNewPostPageData = z.infer<typeof EventNewPostPageDataSchema>;
export type EventNewPostPageError = z.infer<typeof EventNewPostPageErrorSchema>;
export type EventNewPostPageResult = ResultTuple<
  EventNewPostPageError,
  EventNewPostPageData
>;
