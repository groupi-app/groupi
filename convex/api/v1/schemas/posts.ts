import { z } from '@hono/zod-openapi';
import { UserSummarySchema, TimestampSchema } from './common';

/**
 * Post-related API schemas
 */

// Author schema (nullable if author's person record was deleted)
const AuthorSchema = z
  .object({
    id: z.string(),
    user: UserSummarySchema,
  })
  .nullable();

// Reply summary (for embedding in post)
export const ReplySummarySchema = z
  .object({
    id: z.string(),
    text: z.string(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema.nullable(),
    author: AuthorSchema,
  })
  .openapi('ReplySummary');

// Post summary (for list views)
export const PostSummarySchema = z
  .object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    createdAt: TimestampSchema,
    editedAt: TimestampSchema.nullable(),
    author: AuthorSchema,
    replyCount: z.number().int(),
  })
  .openapi('PostSummary');

// Full post details with replies
export const PostDetailSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    createdAt: TimestampSchema,
    editedAt: TimestampSchema.nullable(),
    eventId: z.string(),
    author: AuthorSchema,
    replies: z.array(ReplySummarySchema),
  })
  .openapi('PostDetail');

// Create post request body
export const CreatePostRequestSchema = z
  .object({
    title: z.string().min(1).max(200).openapi({
      example: 'Meeting Notes',
      description: 'Post title',
    }),
    content: z.string().min(1).max(10000).openapi({
      example: 'Here are the notes from our meeting...',
      description: 'Post content',
    }),
  })
  .openapi('CreatePostRequest');

// Update post request body
export const UpdatePostRequestSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().min(1).max(10000).optional(),
  })
  .openapi('UpdatePostRequest');

// Post list response
export const PostListResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(PostSummarySchema),
  })
  .openapi('PostListResponse');

// Single post response
export const PostResponseSchema = z
  .object({
    success: z.literal(true),
    data: PostDetailSchema,
  })
  .openapi('PostResponse');

// Post create response
export const PostCreateResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      postId: z.string(),
    }),
  })
  .openapi('PostCreateResponse');
