import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '@groupi/services';
import {
  // Import safe-wrapper service functions
  updateMembershipRole,
  deleteMembership,
  updateRSVP,
} from '@groupi/services';

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

// Simplified schema for updating member role (hooks-friendly)
const UpdateMemberRoleSchema = z.object({
  memberId: z.string(),
  role: z.enum(['ORGANIZER', 'MODERATOR', 'ATTENDEE']),
});

// Simplified schema for removing member (hooks-friendly)
const RemoveMemberSchema = z.object({
  memberId: z.string(),
});

const UpdateRSVPSchema = z.object({
  eventId: z.string(),
  status: z.enum(['YES', 'NO', 'MAYBE', 'PENDING']),
});

// ============================================================================
// MEMBER ROUTER
// ============================================================================

export const memberRouter = createTRPCRouter({
  /**
   * Granular: memberships for an event (lightweight)
   */
  getByEventId: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Verify membership
      const isMember = await db.membership.findFirst({
        where: { eventId: input.eventId, personId: ctx.userId },
        select: { id: true },
      });
      if (!isMember) return [new Error('Unauthorized'), null] as const;
      const memberships = await db.membership.findMany({
        where: { eventId: input.eventId },
        select: {
          id: true,
          personId: true,
          eventId: true,
          role: true,
          rsvpStatus: true,
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              imageUrl: true,
            },
          },
        },
      });
      return [null, memberships] as const;
    }),
  /**
   * Update a member's role in an event (hooks-friendly version)
   * Returns: [error, { message, membership }] tuple
   */
  updateRole: protectedProcedure
    .input(UpdateMemberRoleSchema)
    .mutation(async ({ input, ctx }) => {
      // First, fetch the membership to get full details
      const [fetchError, membership] = await (async () => {
        try {
          const membership = await db.membership.findUnique({
            where: { id: input.memberId },
          });
          return [null, membership];
        } catch (error) {
          return [error, null];
        }
      })();

      if (fetchError || !membership) {
        return [new Error('Membership not found'), null];
      }

      // Use the existing service with full membership object
      return await updateMembershipRole(
        {
          id: membership.id,
          eventId: membership.eventId,
          personId: membership.personId,
          role: membership.role,
          rsvpStatus: membership.rsvpStatus,
        },
        input.role,
        ctx.userId
      );
    }),

  /**
   * Remove a member from an event (hooks-friendly version)
   * Returns: [error, { message }] tuple
   */
  remove: protectedProcedure
    .input(RemoveMemberSchema)
    .mutation(async ({ input, ctx }) => {
      // First, fetch the membership to get full details
      const [fetchError, membership] = await (async () => {
        try {
          const membership = await db.membership.findUnique({
            where: { id: input.memberId },
          });
          return [null, membership];
        } catch (error) {
          return [error, null];
        }
      })();

      if (fetchError || !membership) {
        return [new Error('Membership not found'), null];
      }

      // Use the existing service with full membership object
      return await deleteMembership(
        {
          id: membership.id,
          eventId: membership.eventId,
          personId: membership.personId,
          role: membership.role,
          rsvpStatus: membership.rsvpStatus,
        },
        ctx.userId
      );
    }),

  /**
   * Update current user's RSVP status for an event
   * Returns: [error, { message, membership }] tuple
   */
  updateRSVP: protectedProcedure
    .input(UpdateRSVPSchema)
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await updateRSVP(input.eventId, input.status, ctx.userId);
    }),
});

export type MemberRouter = typeof memberRouter;
