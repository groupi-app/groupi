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

  /**
   * List all replies (admin operation with pagination)
   * Returns: [error, { items, nextCursor, totalCount }] tuple
   */
  listAll: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { db } = await import('@groupi/services');
        const limit = input.limit || 50;
        const search = input.search?.trim();

        // Build where clause for search
        const where = search
          ? {
              text: { contains: search, mode: 'insensitive' as const },
            }
          : {};

        // Get total count for pagination UI
        const totalCount = await db.reply.count({ where });

        // Fetch replies with cursor-based pagination
        const replies = await db.reply.findMany({
          where,
          take: limit + 1, // Fetch one extra to determine if there's a next page
          cursor: input.cursor ? { id: input.cursor } : undefined,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            text: true,
            createdAt: true,
            updatedAt: true,
            author: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            post: {
              select: {
                id: true,
                title: true,
                event: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        });

        // Determine if there's a next page
        let nextCursor: string | undefined = undefined;
        if (replies.length > limit) {
          const nextItem = replies.pop(); // Remove the extra item
          nextCursor = nextItem!.id;
        }

        // Transform data for client
        const items = replies.map(reply => ({
          id: reply.id,
          text: reply.text,
          createdAt: reply.createdAt,
          updatedAt: reply.updatedAt,
          author: reply.author.user,
          post: reply.post,
        }));

        return [
          null,
          {
            items,
            nextCursor,
            totalCount,
          },
        ] as const;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        return [error, undefined] as const;
      }
    }),
});

export type ReplyRouter = typeof replyRouter;
