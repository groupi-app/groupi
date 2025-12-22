/* eslint-disable no-redeclare */
import { z } from 'zod';
import { InviteSchema, EventSchema } from '../generated';

// ============================================================================
// INVITE DOMAIN PARAMETER SCHEMAS
// ============================================================================

// Fetch invite page data parameters
export const GetInvitePageDataParams = z.object({
  inviteId: InviteSchema.shape.id,
});

export type GetInvitePageDataParams = z.infer<typeof GetInvitePageDataParams>;

// Get event invite page data parameters
export const GetEventInvitePageDataParams = z.object({
  eventId: EventSchema.shape.id,
});

export type GetEventInvitePageDataParams = z.infer<
  typeof GetEventInvitePageDataParams
>;

// Create invite parameters (migrated from CreateInviteInput)
export const CreateInviteParams = InviteSchema.pick({
  eventId: true,
}).extend({
  name: InviteSchema.shape.name.nullable().optional(),
  maxUses: InviteSchema.shape.maxUses.nullable().optional(),
  expiresAt: InviteSchema.shape.expiresAt.nullable().optional(),
});

export type CreateInviteParams = z.infer<typeof CreateInviteParams>;

// Delete invite parameters
export const DeleteInviteParams = z.object({
  inviteId: InviteSchema.shape.id,
});

export type DeleteInviteParams = z.infer<typeof DeleteInviteParams>;

// Accept invite parameters
export const AcceptInviteParams = z.object({
  inviteId: InviteSchema.shape.id,
});

export type AcceptInviteParams = z.infer<typeof AcceptInviteParams>;
