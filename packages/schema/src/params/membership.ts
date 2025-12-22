/* eslint-disable no-redeclare */
import { z } from 'zod';
import { MembershipSchema, EventSchema } from '../generated';

// ============================================================================
// MEMBERSHIP DOMAIN PARAMETER SCHEMAS
// ============================================================================

// Get member list data parameters
export const GetMemberListDataParams = z.object({
  eventId: EventSchema.shape.id,
});

export type GetMemberListDataParams = z.infer<typeof GetMemberListDataParams>;

// Update member RSVP parameters
export const UpdateMemberRSVPParams = z.object({
  eventId: z.string(),
  rsvpStatus: MembershipSchema.shape.rsvpStatus,
});

export type UpdateMemberRSVPParams = z.infer<typeof UpdateMemberRSVPParams>;

// Update member role parameters
export const UpdateMemberRoleParams = z.object({
  membershipId: MembershipSchema.shape.id,
  role: MembershipSchema.shape.role,
});

export type UpdateMemberRoleParams = z.infer<typeof UpdateMemberRoleParams>;

// Remove member from event parameters
export const RemoveMemberFromEventParams = z.object({
  membershipId: MembershipSchema.shape.id,
});

export type RemoveMemberFromEventParams = z.infer<
  typeof RemoveMemberFromEventParams
>;
