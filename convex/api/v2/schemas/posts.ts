import { z, extendZodWithOpenApi } from '@hono/zod-openapi';
extendZodWithOpenApi(z);
import { UserSummarySchema, TimestampSchema } from './common';

/**
 * Post-related API schemas
 */

// Author schema (nullable if author's person record was deleted)
const AuthorSchema = z
  .object({
    id: z.string(),
    kind: z.enum(['user', 'integration']).optional(),
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
    repliesDisabled: z.boolean().optional(),
    repliesRevision: z.number().optional(),
    pinnedAt: z.number().optional(),
    pinRevision: z.number().optional(),
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
    repliesDisabled: z.boolean().optional(),
    repliesRevision: z.number().optional(),
    pinnedAt: z.number().optional(),
    pinRevision: z.number().optional(),
    eventId: z.string(),
    author: AuthorSchema,
    replies: z.array(ReplySummarySchema),
  })
  .openapi('PostDetail');

// Create post request body
export const CreatePostRequestSchema = z
  .object({
    repliesDisabled: z.boolean().optional(),
    title: z.string().min(1).max(65536).openapi({
      example: 'Meeting Notes',
      description: 'Post title',
    }),
    content: z.string().min(1).max(65536).openapi({
      example: 'Here are the notes from our meeting...',
      description: 'Post content',
    }),
  })
  .openapi('CreatePostRequest');

// Update post request body
export const UpdatePostRequestSchema = z
  .object({
    repliesDisabled: z.boolean().optional(),
    expectedRepliesRevision: z.number().int().nonnegative().optional(),
    title: z.string().min(1).max(65536).optional(),
    content: z.string().min(1).max(65536).optional(),
  })
  .openapi('UpdatePostRequest');

// Post list response
export const PostListResponseSchema = z
  .array(PostSummarySchema)
  .openapi('PostListResponse');

// Single post response
export const PostResponseSchema = PostDetailSchema;

// Post create response
export const PostCreateResponseSchema = z
  .object({
    postId: z.string(),
  })
  .openapi('PostCreateResponse');
