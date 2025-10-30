import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import {
  // Import service functions
  fetchPersonData,
  fetchUserDashboardData,
  // Better Auth admin functions
  createUserAdmin,
  updateUserAdmin,
  deleteUserAdmin,
  createLogger,
} from '@groupi/services';
import { z } from 'zod';

const logger = createLogger('person-router');

// ============================================================================
// PERSON ROUTER
// ============================================================================

export const personRouter = createTRPCRouter({
  /**
   * Get person data by user ID
   * Returns: [error, userDashboardDTO] tuple
   */
  getById: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx: _ctx }) => {
      return await fetchPersonData({
        personId: input.userId,
      });
    }),

  /**
   * Get current user's data
   * Returns: [error, userDashboardDTO] tuple
   */
  getCurrent: protectedProcedure.query(async () => {
    return await fetchUserDashboardData({});
  }),

  /**
   * Update person data
   * Uses Better Auth admin API, automatically syncs Person table via hooks
   * Returns: [error, result] tuple
   */
  update: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        image: z.string().optional(),
        imageKey: z.string().optional(),
        oldImageKey: z.string().optional(), // For deleting old image
        pronouns: z.string().optional(),
        bio: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Delete old image from UploadThing if:
      // 1. A new image is being uploaded (different key), OR
      // 2. The image is being cleared/removed (no new image)
      const shouldDeleteOldImage =
        input.oldImageKey &&
        (input.oldImageKey !== input.imageKey || !input.image);

      if (shouldDeleteOldImage && input.oldImageKey) {
        try {
          const { UTApi } = await import('uploadthing/server');
          const utapi = new UTApi();
          await utapi.deleteFiles(input.oldImageKey);
        } catch (error) {
          // Log but don't fail the update if deletion fails
          logger.error(
            { error, imageKey: input.oldImageKey },
            'Failed to delete old avatar from UploadThing'
          );
        }
      }

      return await updateUserAdmin({
        userId: input.userId,
        name: input.name,
        email: input.email,
        image: input.image,
        imageKey: input.imageKey,
        pronouns: input.pronouns,
        bio: input.bio,
      });
    }),

  /**
   * Create user (admin operation)
   * Uses Better Auth admin API, automatically creates Person record via hooks
   * Returns: [error, result] tuple
   */
  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        username: z.string().optional(),
        image: z.string().optional(),
        role: z.enum(['admin', 'user']).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await createUserAdmin({
        name: input.name,
        email: input.email,
        username: input.username,
        image: input.image,
        role: input.role,
      });
    }),

  /**
   * Update user by ID (admin operation)
   * Uses Better Auth admin API, automatically syncs Person table via hooks
   * Returns: [error, result] tuple
   */
  updateById: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        username: z.string().optional(),
        role: z.string().optional(),
        image: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await updateUserAdmin({
        userId: input.id,
        name: input.name,
        email: input.email,
        username: input.username,
        role: input.role,
        image: input.image,
      });
    }),

  /**
   * Delete user (admin operation)
   * Uses Better Auth admin API, automatically deletes Person record via hooks
   * Returns: [error, result] tuple
   */
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteUserAdmin({
        userId: input.id,
      });
    }),

  /**
   * List all users (admin operation)
   * Returns all users with their activity counts for admin dashboard
   * Returns: [error, users] tuple
   */
  listAll: protectedProcedure.query(async () => {
    // Fetch from User table (auth data) and join with Person (relationships)
    const { db } = await import('@groupi/services');
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        displayUsername: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get activity counts from Person table
    const usersWithCounts = await Promise.all(
      users.map(async user => {
        const person = await db.person.findUnique({
          where: { id: user.id },
          select: {
            _count: {
              select: {
                memberships: true,
                posts: true,
                replies: true,
              },
            },
          },
        });
        return {
          ...user,
          _count: person?._count || { memberships: 0, posts: 0, replies: 0 },
        };
      })
    );

    return [null, usersWithCounts] as const;
  }),

  // ============================================================================
  // COMPONENT-SPECIFIC DATA ENDPOINTS
  // ============================================================================

  /**
   * Get my events data (for MyEvents page)
   * Returns: [error, MyEventsData] tuple
   */
  getMyEventsData: protectedProcedure.query(async ({ ctx: _ctx }) => {
    try {
      // tRPC context logged by middleware

      // Services already handle all error logging
      return await fetchUserDashboardData({});
    } catch (err) {
      // Return tuple with error instead of throwing
      const error = err instanceof Error ? err : new Error(String(err));
      return [error, undefined] as const;
    }
  }),
});

export type PersonRouter = typeof personRouter;
