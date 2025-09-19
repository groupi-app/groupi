import { z } from 'zod';
import { EventSchema, MembershipSchema } from '../generated';
import type { ResultTuple } from '../result-tuple';

// ============================================================================
// EVENT EDIT PAGE SCHEMAS
// ============================================================================

// Event data for the edit page
export const EventEditEventSchema = EventSchema.pick({
  id: true,
  title: true,
  description: true,
  location: true,
});

// Main data structure for Event Edit page
export const EventEditPageDataSchema = z.object({
  event: EventEditEventSchema,
  userRole: MembershipSchema.shape.role,
});

// Error types
export const EventEditPageErrorSchema = z.discriminatedUnion('_tag', [
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
export type EventEditPageData = z.infer<typeof EventEditPageDataSchema>;
export type EventEditPageError = z.infer<typeof EventEditPageErrorSchema>;
export type EventEditPageResult = ResultTuple<
  EventEditPageError,
  EventEditPageData
>;
