import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import {
  // Import service functions
  createInvite,
  deleteInvite,
  acceptInvite,
  fetchInvitePageData,
  getEventInvitePageData,
} from '@groupi/services';
import { CreateInviteParams } from '@groupi/schema/params';
import { z } from 'zod';

// ============================================================================
// INVITE ROUTER
// ============================================================================

export const inviteRouter = createTRPCRouter({
  /**
   * Get event invite management data
   * Returns: [error, eventInviteDTO] tuple
   */
  getEventData: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      return await getEventInvitePageData({
        eventId: input.eventId,
      });
    }),

  /**
   * Get individual invite data by ID
   * Returns: [error, individualInviteDTO] tuple
   */
  getById: publicProcedure
    .input(z.object({ inviteId: z.string() }))
    .query(async ({ input }) => {
      return await fetchInvitePageData({
        inviteId: input.inviteId,
      });
    }),

  /**
   * Create a new invite for an event
   * Returns: [error, invite] tuple
   */
  create: protectedProcedure
    .input(CreateInviteParams)
    .mutation(async ({ input }) => {
      return await createInvite({
        eventId: input.eventId,
        name: input.name,
        maxUses: input.maxUses,
        expiresAt: input.expiresAt,
      });
    }),

  /**
   * Delete a single invite
   * Returns: [error, { message }] tuple
   */
  delete: protectedProcedure
    .input(z.object({ inviteId: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteInvite({
        inviteId: input.inviteId,
      });
    }),

  /**
   * Accept an invite (join event)
   * Returns: [error, { message, membershipId }] tuple
   */
  accept: publicProcedure
    .input(z.object({ inviteId: z.string(), personId: z.string() }))
    .mutation(async ({ input }) => {
      return await acceptInvite({
        inviteId: input.inviteId,
      });
    }),

  // ============================================================================
  // COMPONENT-SPECIFIC DATA ENDPOINTS
  // ============================================================================

  /**
   * Get invite page data
   * Returns: [error, InvitePageData] tuple
   */
  getInvitePageData: publicProcedure
    .input(z.object({ inviteId: z.string() }))
    .query(async ({ input }) => {
      return await fetchInvitePageData({
        inviteId: input.inviteId,
      });
    }),

  /**
   * Get event invite page data (for invite management)
   * Returns: [error, EventInvitePageData] tuple
   */
  getEventInvitePageData: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      return await getEventInvitePageData({
        eventId: input.eventId,
      });
    }),
});

export type InviteRouter = typeof inviteRouter;
