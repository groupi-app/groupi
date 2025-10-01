import { createTRPCRouter, protectedProcedure } from '../trpc';
import {
  // (Removed unused param schema imports)
  // Import service functions
  createPost,
  updatePost,
  deletePost,
  fetchPostDetailPageData,
  getPostFeedData,
} from '@groupi/services';
import { z } from 'zod';

// (Removed unused local schema constants)

// ============================================================================
// POST ROUTER
// ============================================================================

export const postRouter = createTRPCRouter({
  /**
   * List posts for an event with pagination
   */
  getPostFeedData: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).optional(),
      })
    )
    .query(async ({ input }) => {
      return await getPostFeedData({
        eventId: input.eventId,
        cursor: input.cursor,
        limit: input.limit || 20,
      });
    }),
  /**
   * Get post by ID with replies (for new hooks)
   * Returns: [error, post] tuple
   */
  getByIdWithReplies: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ input }) => {
      return await fetchPostDetailPageData({
        postId: input.postId,
      });
    }),

  /**
   * Create a new post (using Prisma unchecked schema)
   * Client sends: { eventId, title, content }
   * Server sets: authorId (from auth), id, createdAt, updatedAt, etc.
   * Returns: [error, post] tuple
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        content: z.string(),
        eventId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await createPost({
        title: input.title,
        content: input.content,
        eventId: input.eventId,
      });
    }),

  /**
   * Update an existing post (using Prisma unchecked schema)
   * Client can send: { id, title?, content?, eventId? } - all optional except id
   * Returns: [error, post] tuple
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        content: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await updatePost({
        id: input.id,
        title: input.title,
        content: input.content,
      });
    }),

  /**
   * Delete a post
   * Returns: [error, { message }] tuple
   */
  delete: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ input }) => {
      return await deletePost({
        postId: input.postId,
      });
    }),
});

export type PostRouter = typeof postRouter;
