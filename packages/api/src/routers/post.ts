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

  /**
   * List all posts (admin operation with pagination)
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
              OR: [
                { title: { contains: search, mode: 'insensitive' as const } },
                { content: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {};

        // Get total count for pagination UI
        const totalCount = await db.post.count({ where });

        // Fetch posts with cursor-based pagination
        const posts = await db.post.findMany({
          where,
          take: limit + 1, // Fetch one extra to determine if there's a next page
          cursor: input.cursor ? { id: input.cursor } : undefined,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            editedAt: true,
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
            event: {
              select: {
                id: true,
                title: true,
              },
            },
            _count: {
              select: {
                replies: true,
              },
            },
          },
        });

        // Determine if there's a next page
        let nextCursor: string | undefined = undefined;
        if (posts.length > limit) {
          const nextItem = posts.pop(); // Remove the extra item
          nextCursor = nextItem!.id;
        }

        // Transform data for client
        const items = posts.map(post => ({
          id: post.id,
          title: post.title,
          content: post.content,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          editedAt: post.editedAt,
          author: post.author.user,
          event: post.event,
          _count: post._count,
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

export type PostRouter = typeof postRouter;
