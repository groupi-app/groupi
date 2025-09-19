import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '@groupi/services';
import {
  // Import schemas from @groupi/schema with the names we want
  PostSchema,
} from '@groupi/schema';
import {
  // Import safe-wrapper service functions
  fetchPostPageData,
  fetchReplyFeedData,
  createPost,
  updatePost,
  deletePost,
  // Import component-specific services
  getPostDetailData,
} from '@groupi/services';

// ============================================================================
// INPUT SCHEMAS (using @groupi/schema)
// ============================================================================

// Get post by ID schema
export const GetPostInputSchema = PostSchema.pick({ id: true });

// Client-side input schemas (exclude server-managed fields)
export const CreatePostInputSchema = z.object({
  title: z.string(),
  content: z.string(),
  eventId: z.string(),
});

export const UpdatePostInputSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.string().optional(),
});

// ============================================================================
// POST ROUTER
// ============================================================================

export const postRouter = createTRPCRouter({
  /**
   * Granular: list posts for an event (no replies)
   */
  listByEventId: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const isMember = await db.membership.findFirst({
        where: { eventId: input.eventId, personId: ctx.userId },
        select: { id: true },
      });
      if (!isMember) return [new Error('Unauthorized'), null] as const;
      const take = input.limit ?? 20;
      const posts = await db.post.findMany({
        where: { eventId: input.eventId },
        orderBy: { createdAt: 'desc' },
        take,
        skip: input.cursor ? 1 : 0,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        select: {
          id: true,
          title: true,
          content: true,
          authorId: true,
          createdAt: true,
          updatedAt: true,
          editedAt: true,
        },
      });
      const nextCursor =
        posts.length === take ? posts[posts.length - 1].id : undefined;
      return [null, { items: posts, nextCursor }] as const;
    }),
  /**
   * Get post by ID with replies (for new hooks)
   * Returns: [error, post] tuple
   */
  getByIdWithReplies: protectedProcedure
    .input(GetPostInputSchema.transform(data => ({ postId: data.id })))
    .query(async ({ input, ctx }) => {
      // Use the existing fetchPostPageData which includes replies
      return await fetchPostPageData(input.postId, ctx.userId);
    }),

  /**
   * Get post page data (for post detail view)
   * Returns: [error, { post, userId, userRole }] tuple
   */
  getPageData: protectedProcedure
    .input(GetPostInputSchema.transform(data => ({ postId: data.id })))
    .query(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await fetchPostPageData(input.postId, ctx.userId);
    }),

  /**
   * Get post with event data (for reply components)
   * Returns: [error, { post, userId, userRole }] tuple
   */
  getWithEventData: protectedProcedure
    .input(GetPostInputSchema.transform(data => ({ postId: data.id })))
    .query(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await fetchReplyFeedData(input.postId, ctx.userId);
    }),

  /**
   * Create a new post (using Prisma unchecked schema)
   * Client sends: { eventId, title, content }
   * Server sets: authorId (from auth), id, createdAt, updatedAt, etc.
   * Returns: [error, post] tuple
   */
  create: protectedProcedure
    .input(CreatePostInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Set authorId from authenticated context, client provides the rest
      return await createPost(
        {
          title: input.title,
          content: input.content,
          eventId: input.eventId,
        },
        ctx.userId // authorId from auth context
      );
    }),

  /**
   * Update an existing post (using Prisma unchecked schema)
   * Client can send: { id, title?, content?, eventId? } - all optional except id
   * Returns: [error, post] tuple
   */
  update: protectedProcedure
    .input(UpdatePostInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Only pass the fields that are actually provided and needed by the service
      return await updatePost(
        {
          id: input.id,
          title: input.title!,
          content: input.content!,
        },
        ctx.userId
      );
    }),

  /**
   * Delete a post
   * Returns: [error, { message }] tuple
   */
  delete: protectedProcedure
    .input(GetPostInputSchema.transform(data => ({ postId: data.id })))
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await deletePost(input.postId, ctx.userId);
    }),

  // ============================================================================
  // COMPONENT-SPECIFIC DATA ENDPOINTS
  // ============================================================================

  /**
   * Get post detail data (for PostDetail page)
   * Returns: [error, PostDetailData] tuple
   */
  getDetailData: protectedProcedure
    .input(GetPostInputSchema.transform(data => ({ postId: data.id })))
    .query(async ({ input, ctx }) => {
      return await getPostDetailData(input.postId, ctx.userId);
    }),
});

export type PostRouter = typeof postRouter;
