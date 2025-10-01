/* eslint-disable no-redeclare */
import { z } from 'zod';
import { PostSchema } from '../generated';

// ============================================================================
// POST DOMAIN PARAMETER SCHEMAS
// ============================================================================

// Get posts by event parameters
export const GetPostFeedDataParams = z.object({
  eventId: z.string(),
  cursor: z.string().optional(),
  limit: z.number().default(20),
});

export type GetPostFeedDataParams = z.infer<typeof GetPostFeedDataParams>;

// Fetch post detail page data parameters
export const GetPostDetailPageDataParams = z.object({
  postId: PostSchema.shape.id,
});

export type GetPostDetailPageDataParams = z.infer<
  typeof GetPostDetailPageDataParams
>;

// Create post parameters (migrated from CreatePostInput)
export const CreatePostParams = PostSchema.pick({
  title: true,
  content: true,
  eventId: true,
}).extend({});

export type CreatePostParams = z.infer<typeof CreatePostParams>;

// Update post parameters (migrated from UpdatePostInput)
export const UpdatePostParams = PostSchema.pick({
  id: true,
}).extend({
  title: PostSchema.shape.title.optional(),
  content: PostSchema.shape.content.optional(),
});

export type UpdatePostParams = z.infer<typeof UpdatePostParams>;

// Delete post parameters
export const DeletePostParams = z.object({
  postId: PostSchema.shape.id,
});

export type DeletePostParams = z.infer<typeof DeletePostParams>;
