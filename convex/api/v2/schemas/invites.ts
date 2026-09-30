import { z } from '@hono/zod-openapi';
import { EventListQuerySchema } from './events';
const nullableString = z.string().nullable();
export const InviteSummarySchema = z
  .object({
    id: z.string(),
    eventId: z.string(),
    token: z.string(),
    name: nullableString,
    maxUses: z.number().nullable(),
    usesTotal: z.number().nullable(),
    usesRemaining: z.number().nullable(),
    expiresAt: z.number().nullable(),
    createdAt: z.number(),
    kind: z.enum(['link', 'email']),
    email: nullableString,
    recipientName: nullableString,
    customMessage: nullableString,
    emailStatus: z.enum(['pending', 'queued']).nullable(),
  })
  .openapi('InviteSummary');
export const InviteListResponseSchema = z.array(InviteSummarySchema);
export const InvitePageSchema = z.object({
  items: InviteListResponseSchema,
  nextCursor: nullableString,
});
export const InvitePublicResponseSchema = z
  .object({
    id: z.string(),
    eventId: z.string(),
    eventTitle: z.string(),
    eventDescription: nullableString,
    eventLocation: nullableString,
    name: nullableString,
    expired: z.boolean(),
    maxUsesReached: z.boolean(),
  })
  .openapi('InvitePublic');
export const CreateInviteRequestSchema = z
  .object({
    name: z.string().max(200).optional(),
    maxUses: z.number().int().min(1).max(10000).optional(),
    expiresAt: z.string().datetime({ offset: true }).optional(),
  })
  .strict();
export const EditInviteRequestSchema = z
  .object({
    name: z.string().max(200).optional(),
    maxUses: z.number().int().min(1).max(10000).nullable().optional(),
    expiresAt: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .strict()
  .refine(value => Object.keys(value).length > 0, {
    message: 'Provide at least one field to edit',
  });
export const EmailInviteRequestSchema = z
  .object({
    invites: z
      .array(
        z
          .object({
            email: z.string().trim().email(),
            recipientName: z.string().max(200).optional(),
            plusOnes: z.number().int().min(0).max(99).optional(),
          })
          .strict()
      )
      .min(1)
      .max(100),
    customMessage: z.string().max(480).optional(),
    expiresAt: z.string().datetime({ offset: true }).optional(),
    send: z.boolean().optional(),
  })
  .strict();
export const MemberInviteRequestSchema = z
  .object({
    username: z.string().trim().min(2).max(100),
    role: z.enum(['ATTENDEE', 'MODERATOR']).optional(),
    message: z.string().max(480).optional(),
  })
  .strict();
export const MemberInviteSummarySchema = z.object({
  inviteId: z.string(),
  eventId: z.string(),
  eventTitle: z.string(),
  inviterId: z.string(),
  inviteeId: z.string(),
  role: z.enum(['ATTENDEE', 'MODERATOR']),
  status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED']),
  message: nullableString,
  createdAt: z.number(),
  respondedAt: z.number().nullable(),
});
export const MemberInvitePageSchema = z.object({
  items: z.array(MemberInviteSummarySchema),
  nextCursor: nullableString,
});
export const InviteListQuerySchema = EventListQuerySchema.safeExtend({
  kind: z.enum(['link', 'email', 'all']).optional(),
});
export const MemberListQuerySchema = EventListQuerySchema.safeExtend({
  status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'all']).optional(),
});
export const InviteIdParamSchema = z.object({ inviteId: z.string() });
export const InviteTokenParamSchema = z.object({ token: z.string() });
export const AcceptInviteResponseSchema = z.object({
  eventId: z.string(),
  membershipId: z.string(),
});
