import { createTRPCRouter, protectedProcedure } from '../trpc';
import {
  // Import service functions
  createReply,
  updateReply,
  deleteReply,
  getRepliesByPost,
} from '@groupi/services';
import { z } from 'zod';

// ============================================================================
// REPLY ROUTER
// ============================================================================

export const replyRouter = createTRPCRouter({
  /**
   * List replies for a post with pagination
   */
  listByPostId: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).optional(),
      })
    )
    .query(async ({ input }) => {
      return await getRepliesByPost({
        postId: input.postId,
        cursor: input.cursor,
        limit: input.limit || 50,
      });
    }),
  /**
   * Create a new reply to a post (using schema-based validation)
   * Returns: [error, reply] tuple
   */
  create: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        text: z.string().min(1, 'Reply text is required'),
      })
    )
    .mutation(async ({ input }) => {
      return await createReply({
        postId: input.postId,
        content: input.text,
      });
    }),

  /**
   * Create a new reply to a post (legacy endpoint)
   * Returns: [error, reply] tuple
   */
  createLegacy: protectedProcedure
    .input(z.object({ postId: z.string(), text: z.string().min(1) }))
    .mutation(async ({ input }) => {
      return await createReply({
        postId: input.postId,
        content: input.text,
      });
    }),

  /**
   * Update an existing reply (using schema-based validation)
   * Returns: [error, { message }] tuple
   */
  update: protectedProcedure
    .input(
      z.object({
        replyId: z.string(),
        text: z.string().min(1, 'Reply text is required'),
      })
    )
    .mutation(async ({ input }) => {
      return await updateReply({
        replyId: input.replyId,
        content: input.text,
      });
    }),

  /**
   * Update an existing reply (legacy endpoint)
   * Returns: [error, { message }] tuple
   */
  updateLegacy: protectedProcedure
    .input(z.object({ replyId: z.string(), text: z.string().min(1) }))
    .mutation(async ({ input }) => {
      return await updateReply({
        replyId: input.replyId,
        content: input.text,
      });
    }),

  /**
   * Delete a reply (using schema-based validation)
   * Returns: [error, { message }] tuple
   */
  delete: protectedProcedure
    .input(z.object({ replyId: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteReply({
        replyId: input.replyId,
      });
    }),

  /**
   * Delete a reply (legacy endpoint)
   * Returns: [error, { message }] tuple
   */
  deleteLegacy: protectedProcedure
    .input(z.object({ replyId: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteReply({
        replyId: input.replyId,
      });
    }),
});

export type ReplyRouter = typeof replyRouter;
