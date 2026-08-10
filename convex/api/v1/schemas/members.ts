import { z, extendZodWithOpenApi } from '@hono/zod-openapi';
extendZodWithOpenApi(z);
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
  .array(MemberDetailSchema)
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

// RSVP update response
export const RsvpUpdateResponseSchema = z
  .object({
    membershipId: z.string(),
    rsvpStatus: RsvpStatusSchema,
  })
  .openapi('RsvpUpdateResponse');
