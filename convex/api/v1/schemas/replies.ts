import { z } from '@hono/zod-openapi';
import { UserSummarySchema, TimestampSchema } from './common';

/**
 * Reply-related API schemas
 */

// Full reply details (author may be null if the author's account was deleted)
export const ReplyDetailSchema = z
  .object({
    id: z.string(),
    text: z.string(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema.nullable(),
    postId: z.string(),
    author: z
      .object({
        id: z.string(),
        user: UserSummarySchema,
      })
      .nullable(),
  })
  .openapi('ReplyDetail');

// Create reply request body
export const CreateReplyRequestSchema = z
  .object({
    text: z.string().min(1).max(5000).openapi({
      example: 'Thanks for sharing!',
      description: 'Reply text',
    }),
  })
  .openapi('CreateReplyRequest');

// Update reply request body
export const UpdateReplyRequestSchema = z
  .object({
    text: z.string().min(1).max(5000),
  })
  .openapi('UpdateReplyRequest');

// Reply list response
export const ReplyListResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(ReplyDetailSchema),
  })
  .openapi('ReplyListResponse');

// Single reply response
export const ReplyResponseSchema = z
  .object({
    success: z.literal(true),
    data: ReplyDetailSchema,
  })
  .openapi('ReplyResponse');

// Reply create response
export const ReplyCreateResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      replyId: z.string(),
    }),
  })
  .openapi('ReplyCreateResponse');
