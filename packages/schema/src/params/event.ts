/* eslint-disable no-redeclare */
import { z } from 'zod';
import { EventSchema, PersonSchema } from '../generated';

// ============================================================================
// EVENT DOMAIN PARAMETER SCHEMAS
// ============================================================================

// Get event header data parameters
export const GetEventHeaderDataParams = z.object({
  eventId: EventSchema.shape.id,
});

export type GetEventHeaderDataParams = z.infer<typeof GetEventHeaderDataParams>;

// Get event new post page data parameters
export const GetEventNewPostPageDataParams = z.object({
  eventId: EventSchema.shape.id,
});

export type GetEventNewPostPageDataParams = z.infer<
  typeof GetEventNewPostPageDataParams
>;

// Get event attendees page data parameters
export const GetEventAttendeesPageDataParams = z.object({
  eventId: EventSchema.shape.id,
});

export type GetEventAttendeesPageDataParams = z.infer<
  typeof GetEventAttendeesPageDataParams
>;

// Create event parameters
export const CreateEventParams = EventSchema.pick({
  title: true,
}).extend({
  description: EventSchema.shape.description.optional(),
  location: EventSchema.shape.location.optional(),
  potentialDateTimes: z
    .array(z.string())
    .min(1, 'At least one date option is required'),
});

export type CreateEventParams = z.infer<typeof CreateEventParams>;

// Update event details parameters
export const UpdateEventDetailsParams = z.object({
  eventId: EventSchema.shape.id,
  title: EventSchema.shape.title.optional(),
  description: EventSchema.shape.description.optional(),
  location: EventSchema.shape.location.optional(),
});

export type UpdateEventDetailsParams = z.infer<typeof UpdateEventDetailsParams>;

// Delete event parameters
export const DeleteEventParams = z.object({
  eventId: EventSchema.shape.id,
});

export type DeleteEventParams = z.infer<typeof DeleteEventParams>;

// Leave event parameters
export const LeaveEventParams = z.object({
  eventId: EventSchema.shape.id,
});

export type LeaveEventParams = z.infer<typeof LeaveEventParams>;

// Get mutual events parameters
export const GetMutualEventsParams = z.object({
  otherUserId: PersonSchema.shape.id,
});

export type GetMutualEventsParams = z.infer<typeof GetMutualEventsParams>;
