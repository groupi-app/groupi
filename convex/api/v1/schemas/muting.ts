import { z, extendZodWithOpenApi } from '@hono/zod-openapi';
extendZodWithOpenApi(z);
import { TimestampSchema } from './common';

/**
 * Muting-related API schemas
 */

// Muted event summary
export const MutedEventSchema = z
  .object({
    id: z.string(),
    eventId: z.string(),
    mutedAt: TimestampSchema,
    event: z
      .object({
        id: z.string(),
        title: z.string(),
        description: z.string().nullable(),
        location: z.string().nullable(),
      })
      .nullable(),
  })
  .openapi('MutedEvent');

// Muted post summary
export const MutedPostSchema = z
  .object({
    id: z.string(),
    postId: z.string(),
    mutedAt: TimestampSchema,
    post: z
      .object({
        id: z.string(),
        title: z.string(),
      })
      .nullable(),
  })
  .openapi('MutedPost');

// Muted list response (combined or filtered)
export const MutedListResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      events: z.array(MutedEventSchema),
      posts: z.array(MutedPostSchema),
    }),
  })
  .openapi('MutedListResponse');

// Generic muting success response
export const MutingSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      message: z.string(),
    }),
  })
  .openapi('MutingSuccessResponse');
