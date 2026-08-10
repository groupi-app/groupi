import { z, extendZodWithOpenApi } from '@hono/zod-openapi';
extendZodWithOpenApi(z);
import { TimestampSchema } from './common';

/**
 * Invite-related API schemas
 */

// Invite summary
export const InviteSummarySchema = z
  .object({
    id: z.string(),
    eventId: z.string(),
    token: z.string(),
    name: z.string().nullable(),
    maxUses: z.number().int().nullable(),
    usesTotal: z.number().int().nullable(),
    usesRemaining: z.number().int().nullable(),
    expiresAt: TimestampSchema.nullable(),
    createdAt: TimestampSchema,
  })
  .openapi('InviteSummary');

// Public invite info (no sensitive fields)
export const InvitePublicSchema = z
  .object({
    id: z.string(),
    eventTitle: z.string(),
    eventDescription: z.string().nullable(),
    eventLocation: z.string().nullable(),
    name: z.string().nullable(),
    expired: z.boolean(),
    maxUsesReached: z.boolean(),
  })
  .openapi('InvitePublic');

// Create invite request body
export const CreateInviteRequestSchema = z
  .object({
    maxUses: z.number().int().min(1).optional().openapi({
      example: 10,
      description: 'Maximum number of times this invite can be used',
    }),
    name: z.string().max(200).optional().openapi({
      example: 'Team invite',
      description: 'Optional label for this invite',
    }),
    expiresAt: z.string().datetime().optional().openapi({
      example: '2024-03-01T00:00:00Z',
      description: 'When this invite expires (ISO 8601)',
    }),
  })
  .openapi('CreateInviteRequest');

// Invite ID parameter
export const InviteIdParamSchema = z.object({
  inviteId: z.string().openapi({
    example: 'k170xyz...',
    description: 'Invite ID',
  }),
});

// Invite token parameter
export const InviteTokenParamSchema = z.object({
  token: z.string().openapi({
    example: 'abc-123-def-456',
    description: 'Invite token',
  }),
});

// Invite list response
export const InviteListResponseSchema = z
  .array(InviteSummarySchema)
  .openapi('InviteListResponse');

// Single invite response
export const InviteResponseSchema = InviteSummarySchema;

// Public invite response
export const InvitePublicResponseSchema = InvitePublicSchema;

// Accept invite response
export const AcceptInviteResponseSchema = z
  .object({
    eventId: z.string(),
    membershipId: z.string(),
  })
  .openapi('AcceptInviteResponse');
