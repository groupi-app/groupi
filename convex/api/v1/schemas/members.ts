import { z } from '@hono/zod-openapi';
import {
  RoleSchema,
  RsvpStatusSchema,
  UserSummarySchema,
  TimestampSchema,
} from './common';

/**
 * Member-related API schemas
 */

// Member details (user may be null if the user account was deleted)
export const MemberDetailSchema = z
  .object({
    id: z.string(),
    role: RoleSchema,
    rsvpStatus: RsvpStatusSchema,
    joinedAt: TimestampSchema,
    user: UserSummarySchema.nullable(),
    personId: z.string(),
  })
  .openapi('MemberDetail');

// Member list response
export const MemberListResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(MemberDetailSchema),
  })
  .openapi('MemberListResponse');

// Update member role request body
export const UpdateMemberRoleRequestSchema = z
  .object({
    role: RoleSchema,
  })
  .openapi('UpdateMemberRoleRequest');

// Update RSVP request body
export const UpdateRsvpRequestSchema = z
  .object({
    rsvpStatus: RsvpStatusSchema,
  })
  .openapi('UpdateRsvpRequest');

// Member role update response
export const MemberUpdateResponseSchema = z
  .object({
    success: z.literal(true),
    data: MemberDetailSchema,
  })
  .openapi('MemberUpdateResponse');

// RSVP update response
export const RsvpUpdateResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      membershipId: z.string(),
      rsvpStatus: RsvpStatusSchema,
    }),
  })
  .openapi('RsvpUpdateResponse');

// Leave event response
export const LeaveEventResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      message: z.string(),
    }),
  })
  .openapi('LeaveEventResponse');

// Remove member response
export const RemoveMemberResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      message: z.string(),
    }),
  })
  .openapi('RemoveMemberResponse');
