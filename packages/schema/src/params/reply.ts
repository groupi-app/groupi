/* eslint-disable no-redeclare */
import { z } from 'zod';
import { ReplySchema } from '../generated';

// ============================================================================
// REPLY DOMAIN PARAMETER SCHEMAS
// ============================================================================

// Get replies by post parameters
export const GetRepliesByPostParams = z.object({
  postId: ReplySchema.shape.postId,
  cursor: z.string().optional(),
  limit: z.number().default(50),
});

export type GetRepliesByPostParams = z.infer<typeof GetRepliesByPostParams>;

// Create reply parameters (migrated from CreateReplyInput)
export const CreateReplyParams = z.object({
  content: ReplySchema.shape.text,
  postId: ReplySchema.shape.postId,
});

export type CreateReplyParams = z.infer<typeof CreateReplyParams>;

// Update reply parameters (migrated from UpdateReplyInput)
export const UpdateReplyParams = z.object({
  replyId: ReplySchema.shape.id,
  content: ReplySchema.shape.text,
});

export type UpdateReplyParams = z.infer<typeof UpdateReplyParams>;

// Delete reply parameters
export const DeleteReplyParams = z.object({
  replyId: ReplySchema.shape.id,
});

export type DeleteReplyParams = z.infer<typeof DeleteReplyParams>;
