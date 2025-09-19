import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import {
  // Import safe-wrapper service functions
  fetchPersonData,
  createUserFromWebhook,
  updateUserFromWebhook,
  deleteUserFromWebhook,
  // Import component-specific services
  getEventListData,
  getMyEventsData,
} from '@groupi/services';

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const UserWebhookSchema = z.object({
  id: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  username: z.string(),
  imageUrl: z.string(),
});

const GetPersonSchema = z.object({
  userId: z.string(),
});

const UpdatePersonSchema = z.object({
  userId: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
});

// ============================================================================
// PERSON ROUTER
// ============================================================================

export const personRouter = createTRPCRouter({
  /**
   * Get person data by user ID
   * Returns: [error, userDashboardDTO] tuple
   */
  getById: protectedProcedure
    .input(GetPersonSchema)
    .query(async ({ input, ctx: _ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await fetchPersonData(input.userId);
    }),

  /**
   * Get current user's data
   * Returns: [error, userDashboardDTO] tuple
   */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    // Use the userId from context to get current user's data
    return await fetchPersonData(ctx.userId);
  }),

  /**
   * Update person data
   * Returns: [error, person] tuple
   */
  update: protectedProcedure
    .input(UpdatePersonSchema)
    .mutation(async ({ input, ctx }) => {
      // For now, return a basic update response
      // This should be implemented with a proper updatePerson service function
      const updateData = {
        id: input.userId,
        firstName: input.name?.split(' ')[0] || null,
        lastName: input.name?.split(' ').slice(1).join(' ') || null,
        username: ctx.userId, // Use existing username
        imageUrl: '', // Keep existing image
      };

      return await updateUserFromWebhook(updateData);
    }),

  /**
   * Create user from webhook (Clerk webhook)
   * Returns: [error, person] tuple
   */
  createFromWebhook: publicProcedure
    .input(UserWebhookSchema)
    .mutation(async ({ input }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
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
    .input(UserWebhookSchema)
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
      // Return safe-wrapper tuple directly - no error conversion needed
      return await deleteUserFromWebhook(input.id);
    }),

  // ============================================================================
  // COMPONENT-SPECIFIC DATA ENDPOINTS
  // ============================================================================

  /**
   * Get event list data (for EventList component)
   * Returns: [error, EventListData] tuple
   */
  getEventListData: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      return await getEventListData(input.userId);
    }),

  /**
   * Get my events data (for MyEvents page)
   * Returns: [error, MyEventsData] tuple
   */
  getMyEventsData: protectedProcedure
    .query(async ({ ctx }) => {
      return await getMyEventsData(ctx.userId);
    }),
});

export type PersonRouter = typeof personRouter;
