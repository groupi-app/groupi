import { createTRPCRouter, protectedProcedure } from '../trpc';
import {
  // Import service functions
  updateMemberRole,
  removeMemberFromEvent,
  updateMemberRSVP,
  getMemberListData,
} from '@groupi/services';
import { UpdateMemberRoleParams } from '@groupi/schema/params';
import { z } from 'zod';

// ============================================================================
// MEMBER ROUTER
// ============================================================================

export const memberRouter = createTRPCRouter({
  /**
   * Get memberships for an event
   */
  getByEventId: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      return await getMemberListData({
        eventId: input.eventId,
      });
    }),
  /**
   * Update a member's role in an event (hooks-friendly version)
   * Returns: [error, { message, membership }] tuple
   */
  updateRole: protectedProcedure
    .input(UpdateMemberRoleParams)
    .mutation(async ({ input }) => {
      return await updateMemberRole({
        membershipId: input.membershipId,
        role: input.role,
      });
    }),

  /**
   * Remove a member from an event (hooks-friendly version)
   * Returns: [error, { message }] tuple
   */
  remove: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ input }) => {
      return await removeMemberFromEvent({
        membershipId: input.memberId,
      });
    }),

  /**
   * Update current user's RSVP status for an event
   * Returns: [error, { message, membership }] tuple
   */
  updateRSVP: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        status: z.enum(['YES', 'NO', 'MAYBE', 'PENDING']),
      })
    )
    .mutation(async ({ input }) => {
      return await updateMemberRSVP({
        eventId: input.eventId,
        rsvpStatus: input.status,
      });
    }),
});

export type MemberRouter = typeof memberRouter;
