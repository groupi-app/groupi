import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '@groupi/services';
import {
  // Import schemas from @groupi/schema
  ReplySchema,
} from '@groupi/schema';
import {
  // Import safe-wrapper service functions
  createReply,
  updateReply,
  deleteReply,
} from '@groupi/services';

// ============================================================================
// INPUT SCHEMAS (using @groupi/schema)
// ============================================================================

// Create reply schema - based on ReplySchema
export const CreateReplyInputSchema = z.object({
  postId: z.string().cuid(),
  text: z.string().min(1, 'Reply text is required'),
});

// Update reply schema - based on ReplySchema
export const UpdateReplyInputSchema = z.object({
  replyId: z.string().cuid(),
  text: z.string().min(1, 'Reply text is required'),
});

// Delete reply schema
export const DeleteReplyInputSchema = ReplySchema.pick({ id: true });

// Legacy schemas for backward compatibility
const CreateReplySchemaLegacy = z.object({
  postId: z.string(),
  text: z.string().min(1, 'Reply text is required'),
});

const UpdateReplySchemaLegacy = z.object({
  replyId: z.string(),
  text: z.string().min(1, 'Reply text is required'),
});

const DeleteReplySchemaLegacy = z.object({
  replyId: z.string(),
});

// ============================================================================
// REPLY ROUTER
// ============================================================================

export const replyRouter = createTRPCRouter({
  /**
   * Granular: list replies for a post
   */
  listByPostId: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Ensure user is member of the post's event
      const post = await db.post.findUnique({
        where: { id: input.postId },
        select: { eventId: true },
      });
      if (!post) return [new Error('Not found'), null] as const;
      const isMember = await db.membership.findFirst({
        where: { eventId: post.eventId, personId: ctx.userId },
        select: { id: true },
      });
      if (!isMember) return [new Error('Unauthorized'), null] as const;
      const take = input.limit ?? 50;
      const replies = await db.reply.findMany({
        where: { postId: input.postId },
        orderBy: { createdAt: 'asc' },
        take,
        skip: input.cursor ? 1 : 0,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        select: {
          id: true,
          text: true,
          authorId: true,
          postId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      const nextCursor =
        replies.length === take ? replies[replies.length - 1].id : undefined;
      return [null, { items: replies, nextCursor }] as const;
    }),
  /**
   * Create a new reply to a post (using schema-based validation)
   * Returns: [error, reply] tuple
   */
  create: protectedProcedure
    .input(CreateReplyInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Use ctx.userId as authorId since user is authenticated
      return await createReply(
        input.postId,
        input.text,
        ctx.userId, // authorId from authenticated context
        ctx.userId // userId for authorization
      );
    }),

  /**
   * Create a new reply to a post (legacy endpoint)
   * Returns: [error, reply] tuple
   */
  createLegacy: protectedProcedure
    .input(CreateReplySchemaLegacy)
    .mutation(async ({ input, ctx }) => {
      // Use ctx.userId as authorId since user is authenticated
      return await createReply(
        input.postId,
        input.text,
        ctx.userId, // authorId from authenticated context
        ctx.userId // userId for authorization
      );
    }),

  /**
   * Update an existing reply (using schema-based validation)
   * Returns: [error, { message }] tuple
   */
  update: protectedProcedure
    .input(UpdateReplyInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await updateReply(input.replyId, input.text, ctx.userId);
    }),

  /**
   * Update an existing reply (legacy endpoint)
   * Returns: [error, { message }] tuple
   */
  updateLegacy: protectedProcedure
    .input(UpdateReplySchemaLegacy)
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await updateReply(input.replyId, input.text, ctx.userId);
    }),

  /**
   * Delete a reply (using schema-based validation)
   * Returns: [error, { message }] tuple
   */
  delete: protectedProcedure
    .input(DeleteReplyInputSchema.transform(data => ({ replyId: data.id })))
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await deleteReply(input.replyId, ctx.userId);
    }),

  /**
   * Delete a reply (legacy endpoint)
   * Returns: [error, { message }] tuple
   */
  deleteLegacy: protectedProcedure
    .input(DeleteReplySchemaLegacy)
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await deleteReply(input.replyId, ctx.userId);
    }),
});

export type ReplyRouter = typeof replyRouter;
