import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import {
  // Import safe-wrapper service functions
  getEventInviteData,
  fetchInviteData,
  createInvite,
  deleteInvite,
  deleteInvites,
  acceptInvite,
  // Import component-specific services
  getInvitePageData,
  getEventInvitePageData,
} from '@groupi/services';

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const GetEventInviteDataSchema = z.object({
  eventId: z.string(),
});

const FetchInviteDataSchema = z.object({
  inviteId: z.string(),
});

const CreateInviteSchema = z.object({
  eventId: z.string(),
  name: z.string().optional(),
  maxUses: z.number().nullable().optional(),
  expiresAt: z.date().nullable().optional(),
});

const DeleteInviteSchema = z.object({
  inviteId: z.string(),
});

const DeleteInvitesSchema = z.object({
  inviteIds: z.array(z.string()).min(1, 'At least one invite ID is required'),
});

const AcceptInviteSchema = z.object({
  inviteId: z.string(),
  personId: z.string(),
});

// ============================================================================
// INVITE ROUTER
// ============================================================================

export const inviteRouter = createTRPCRouter({
  /**
   * Get event invite management data
   * Returns: [error, eventInviteDTO] tuple
   */
  getEventData: protectedProcedure
    .input(GetEventInviteDataSchema)
    .query(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await getEventInviteData(input.eventId, ctx.userId);
    }),

  /**
   * Get individual invite data by ID
   * Returns: [error, individualInviteDTO] tuple
   */
  getById: publicProcedure
    .input(FetchInviteDataSchema)
    .query(async ({ input }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await fetchInviteData(input.inviteId);
    }),

  /**
   * Create a new invite for an event
   * Returns: [error, invite] tuple
   */
  create: protectedProcedure
    .input(CreateInviteSchema)
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await createInvite(
        {
          eventId: input.eventId,
          name: input.name,
          maxUses: input.maxUses || null,
          expiresAt: input.expiresAt || null,
        },
        ctx.userId
      );
    }),

  /**
   * Delete a single invite
   * Returns: [error, { message }] tuple
   */
  delete: protectedProcedure
    .input(DeleteInviteSchema)
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await deleteInvite(input.inviteId, ctx.userId);
    }),

  /**
   * Delete multiple invites
   * Returns: [error, { message }] tuple
   */
  deleteMany: protectedProcedure
    .input(DeleteInvitesSchema)
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await deleteInvites(input.inviteIds, ctx.userId);
    }),

  /**
   * Accept an invite (join event)
   * Returns: [error, { message, membershipId }] tuple
   */
  accept: publicProcedure
    .input(AcceptInviteSchema)
    .mutation(async ({ input }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await acceptInvite(input.inviteId, input.personId);
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
      return await getInvitePageData(input.inviteId);
    }),

  /**
   * Get event invite page data (for invite management)
   * Returns: [error, EventInvitePageData] tuple
   */
  getEventInvitePageData: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      return await getEventInvitePageData(input.eventId, ctx.userId);
    }),
});

export type InviteRouter = typeof inviteRouter;
