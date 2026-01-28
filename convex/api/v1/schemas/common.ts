import { z } from '@hono/zod-openapi';

/**
 * Common API schemas for the REST API
 * These are shared across all API endpoints
 */

// Error response schema
export const ErrorResponseSchema = z
  .object({
    success: z.literal(false),
    error: z.object({
      code: z.string().openapi({ example: 'NOT_FOUND' }),
      message: z.string().openapi({ example: 'Resource not found' }),
    }),
  })
  .openapi('ErrorResponse');

// Success response wrapper (generic)
export const SuccessResponseSchema = z
  .object({
    success: z.literal(true),
  })
  .openapi('SuccessResponse');

// Pagination query parameters
export const PaginationQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().min(1).max(100))
    .openapi({ example: '20' }),
  cursor: z.string().optional().openapi({ example: 'abc123' }),
});

// Paginated response wrapper
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) =>
  z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    pagination: z.object({
      hasMore: z.boolean(),
      nextCursor: z.string().nullable(),
    }),
  });

// API key header schema
export const ApiKeyHeaderSchema = z.object({
  'x-api-key': z.string().openapi({
    example: 'grp_xxxxxxxxxxxx',
    description: 'API key for authentication',
  }),
});

// Common ID parameter
export const IdParamSchema = z.object({
  id: z.string().openapi({
    example: 'k170xyz...',
    description: 'Resource ID',
  }),
});

// Event ID parameter
export const EventIdParamSchema = z.object({
  eventId: z.string().openapi({
    example: 'k170xyz...',
    description: 'Event ID',
  }),
});

// Post ID parameter
export const PostIdParamSchema = z.object({
  postId: z.string().openapi({
    example: 'k170xyz...',
    description: 'Post ID',
  }),
});

// Reply ID parameter
export const ReplyIdParamSchema = z.object({
  replyId: z.string().openapi({
    example: 'k170xyz...',
    description: 'Reply ID',
  }),
});

// Member ID parameter
export const MemberIdParamSchema = z.object({
  memberId: z.string().openapi({
    example: 'k170xyz...',
    description: 'Membership ID',
  }),
});

// Timestamp schema
export const TimestampSchema = z.number().int().positive().openapi({
  example: 1704067200000,
  description: 'Unix timestamp in milliseconds',
});

// Date ISO string schema
export const IsoDateStringSchema = z.string().datetime().openapi({
  example: '2024-01-01T12:00:00Z',
  description: 'ISO 8601 date string',
});

// Role enum
export const RoleSchema = z
  .enum(['ORGANIZER', 'MODERATOR', 'ATTENDEE'])
  .openapi({
    example: 'ATTENDEE',
    description: 'Member role in an event',
  });

// RSVP status enum
export const RsvpStatusSchema = z
  .enum(['YES', 'MAYBE', 'NO', 'PENDING'])
  .openapi({
    example: 'YES',
    description: 'RSVP status for an event',
  });

// Availability status enum (includes PENDING for users who haven't responded yet)
export const AvailabilityStatusSchema = z
  .enum(['YES', 'MAYBE', 'NO', 'PENDING'])
  .openapi({
    example: 'YES',
    description: 'Availability for a potential date',
  });

// Reminder offset enum
export const ReminderOffsetSchema = z
  .enum([
    '30_MINUTES',
    '1_HOUR',
    '2_HOURS',
    '4_HOURS',
    '1_DAY',
    '2_DAYS',
    '3_DAYS',
    '1_WEEK',
    '2_WEEKS',
    '4_WEEKS',
  ])
  .openapi({
    example: '1_DAY',
    description: 'How far before the event to send a reminder',
  });

// User summary schema (for embedding in responses)
export const UserSummarySchema = z
  .object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().email().nullable(),
    image: z.string().url().nullable(),
    username: z.string().nullable(),
  })
  .openapi('UserSummary');

// Person summary schema
export const PersonSummarySchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    bio: z.string().nullable(),
    pronouns: z.string().nullable(),
  })
  .openapi('PersonSummary');
