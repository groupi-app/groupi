import { z, extendZodWithOpenApi } from '@hono/zod-openapi';
extendZodWithOpenApi(z);
import {
  RoleSchema,
  RsvpStatusSchema,
  ReminderOffsetSchema,
  UserSummarySchema,
  TimestampSchema,
} from './common';

/**
 * Event-related API schemas
 */

// Potential date time option for event creation/update
export const PotentialDateTimeOptionSchema = z
  .object({
    note: z.string().max(200).optional(),
    start: z.string().datetime({ offset: true }).openapi({
      example: '2024-02-15T18:00:00Z',
      description: 'Start time in ISO 8601 format',
    }),
    end: z.string().datetime({ offset: true }).optional().openapi({
      example: '2024-02-15T21:00:00Z',
      description: 'End time in ISO 8601 format (optional)',
    }),
  })
  .strict();

// Event summary (for list views)
export const EventSummarySchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    location: z.string().nullable(),
    imageUrl: z.string().url().nullable(),
    chosenDateTime: TimestampSchema.nullable(),
    chosenEndDateTime: TimestampSchema.nullable(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
    memberCount: z.number().int(),
    userRole: RoleSchema,
    userRsvpStatus: RsvpStatusSchema,
  })
  .openapi('EventSummary');

// Full event details (creator may be null if the creator's account was deleted)
export const EventDetailSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    location: z.string().nullable(),
    imageUrl: z.string().url().nullable(),
    timezone: z.string(),
    potentialDateTimeOptions: z.array(
      z.object({
        id: z.string(),
        start: z.number(),
        end: z.number().nullable(),
        note: z.string().nullable(),
      })
    ),
    chosenDateTime: TimestampSchema.nullable(),
    chosenEndDateTime: TimestampSchema.nullable(),
    reminderOffset: ReminderOffsetSchema.nullable(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
    creator: z
      .object({
        id: z.string(),
        user: UserSummarySchema,
      })
      .nullable(),
  })
  .openapi('EventDetail');

// Create event request body
export const CreateEventRequestSchema = z
  .object({
    title: z.string().min(1).max(200).openapi({
      example: 'Team Offsite 2024',
      description: 'Event title',
    }),
    description: z.string().max(5000).optional().openapi({
      example: 'Annual team building event',
      description: 'Event description',
    }),
    location: z.string().max(500).optional().openapi({
      example: 'Mountain View, CA',
      description: 'Event location',
    }),
    potentialDateTimeOptions: z
      .array(PotentialDateTimeOptionSchema)
      .optional()
      .openapi({
        description: 'Potential date/time options for voting',
      }),
    gdl: z.string().optional().openapi({
      example: '[Tu,Th]@18-20',
      description:
        'Groupi Date Language expression to generate potential date/time options. Parsed server-side. Cannot be combined with potentialDateTimeOptions.',
    }),
    chosenDateTime: z.string().datetime({ offset: true }).optional().openapi({
      example: '2024-02-15T18:00:00Z',
      description: 'Fixed event start time (for single-date events)',
    }),
    chosenEndDateTime: z
      .string()
      .datetime({ offset: true })
      .optional()
      .openapi({
        example: '2024-02-15T21:00:00Z',
        description: 'Fixed event end time',
      }),
    reminderOffset: ReminderOffsetSchema.optional().openapi({
      description: 'When to send reminder before event',
    }),
  })
  .strict()
  .openapi('CreateEventRequest');

// Update event request body
export const UpdateEventRequestSchema = z
  .object({
    reminderOffset: ReminderOffsetSchema.nullable().optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional(),
    location: z.string().max(500).optional(),
    potentialDateTimeOptions: z.array(PotentialDateTimeOptionSchema).optional(),
  })
  .strict()
  .refine(value => Object.keys(value).length > 0, {
    message: 'Specify at least one event field to update.',
  })
  .openapi('UpdateEventRequest');

// Event list response
export const EventListResponseSchema = z
  .array(EventSummarySchema)
  .openapi('EventListResponse');

// Single event response
export const EventResponseSchema = EventDetailSchema;

// Event create response
export const EventCreateResponseSchema = z
  .object({
    eventId: z.string(),
    membershipId: z.string(),
  })
  .openapi('EventCreateResponse');

export const EventPageResponseSchema = z
  .object({
    items: z.array(EventSummarySchema),
    nextCursor: z.string().nullable(),
  })
  .openapi('EventPageResponse');

export const EventListQuerySchema = z
  .object({
    pagination: z.literal('cursor').optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    cursor: z.string().min(1).max(16384).optional(),
  })
  .refine(
    query =>
      query.pagination === 'cursor' ||
      (query.limit === undefined && query.cursor === undefined),
    {
      message: 'Set pagination=cursor when using limit or cursor',
    }
  );
