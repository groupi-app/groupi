import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import {
  // Import service functions
  fetchPersonData,
  fetchUserDashboardData,
  createUserFromWebhook,
  updateUserFromWebhook,
  deleteUserFromWebhook,
} from '@groupi/services';
import { z } from 'zod';

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
   * Returns: [error, person] tuple
   */
  update: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // For now, return a basic update response
      // This should be implemented with a proper updatePerson service function
      const updateData = {
        id: input.userId,
        firstName: input.name?.split(' ')[0] || null,
        lastName: input.name?.split(' ').slice(1).join(' ') || null,
        imageUrl: '', // Keep existing image
      };

      return await updateUserFromWebhook(updateData);
    }),

  /**
   * Create user from webhook (Clerk webhook)
   * Returns: [error, person] tuple
   */
  createFromWebhook: publicProcedure
    .input(
      z.object({
        id: z.string(),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        username: z.string(),
        imageUrl: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await createUserFromWebhook({
        id: input.id,
        firstName: input.firstName,
        lastName: input.lastName,
        username: input.username,
        imageUrl: input.imageUrl,
      });
    }),

  /**
   * Update user from webhook (Clerk webhook)
   * Returns: [error, person] tuple
   */
  updateFromWebhook: publicProcedure
    .input(
      z.object({
        id: z.string(),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        username: z.string(),
        imageUrl: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await updateUserFromWebhook({
        id: input.id,
        firstName: input.firstName,
        lastName: input.lastName,
        username: input.username,
        imageUrl: input.imageUrl,
      });
    }),

  /**
   * Delete user from webhook (Clerk webhook)
   * Returns: [error, result] tuple
   */
  deleteFromWebhook: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteUserFromWebhook({
        userId: input.id,
      });
    }),

  // ============================================================================
  // COMPONENT-SPECIFIC DATA ENDPOINTS
  // ============================================================================

  /**
   * Get my events data (for MyEvents page)
   * Returns: [error, MyEventsData] tuple
   */
  getMyEventsData: protectedProcedure.query(async ({ ctx }) => {
    try {
      console.log('[tRPC] getMyEventsData called with context:', {
        hasContext: !!ctx,
        contextKeys: ctx ? Object.keys(ctx) : [],
      });

      const [error, result] = await fetchUserDashboardData({});

      if (error) {
        // Enhanced error logging with full error details
        const errorInfo = {
          message: error.message,
          errorType: error._tag || error.constructor.name,
          stack: error.stack,
          cause: error.cause,
          // Try to serialize the full error object
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
          timestamp: new Date().toISOString(),
        };

        console.error('[tRPC] fetchUserDashboardData failed:', errorInfo);

        // Create a more informative error with the original error as cause
        const enhancedError = new Error(
          `Failed to fetch user dashboard data: ${error.message}`
        );
        enhancedError.cause = error;
        (enhancedError as any).originalError = error;
        (enhancedError as any).errorType = error._tag || error.constructor.name;

        // Return the tuple with error - don't throw
        return [error, undefined] as const;
      }

      console.log('[tRPC] getMyEventsData success:', {
        hasResult: !!result,
        resultType: typeof result,
        resultKeys:
          result && typeof result === 'object' ? Object.keys(result) : [],
      });

      // Return the tuple with result - this is the safe-wrapper pattern
      return [null, result] as const;
    } catch (err) {
      // Catch any unexpected errors and log them with full context
      console.error('[tRPC] getMyEventsData unexpected error:', {
        error: err,
        errorMessage: err instanceof Error ? err.message : String(err),
        errorStack: err instanceof Error ? err.stack : undefined,
        errorType: err instanceof Error ? err.constructor.name : typeof err,
        timestamp: new Date().toISOString(),
      });

      // Return tuple with error instead of throwing
      const error = err instanceof Error ? err : new Error(String(err));
      return [error, undefined] as const;
    }
  }),
});

export type PersonRouter = typeof personRouter;
