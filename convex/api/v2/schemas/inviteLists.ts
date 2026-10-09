import { z, extendZodWithOpenApi } from '@hono/zod-openapi';
extendZodWithOpenApi(z);

export const InviteListPersonSchema = z
  .object({
    personId: z.string(),
    name: z.string().nullable(),
    username: z.string().nullable(),
    image: z.string().nullable(),
    available: z.boolean(),
  })
  .openapi('InviteListPerson');
export const SelectableInviteListPersonSchema = InviteListPersonSchema.extend({
  available: z.literal(true),
}).openapi('SelectableInviteListPerson');
export const InviteListSummarySchema = z
  .object({
    inviteListId: z.string(),
    name: z.string(),
    personCount: z.number(),
    availablePersonCount: z.number(),
    needsAttention: z.boolean(),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .openapi('InviteListSummary');
export const InviteListDetailSchema = InviteListSummarySchema.extend({
  people: z.array(InviteListPersonSchema),
}).openapi('InviteListDetail');
export const InviteListCollectionSchema = z
  .object({ items: z.array(InviteListSummarySchema) })
  .openapi('InviteListCollection');
export const InviteListPeopleSchema = z
  .object({ items: z.array(SelectableInviteListPersonSchema) })
  .openapi('InviteListPeople');
const listName = z.string().trim().min(1).max(100);
const personIds = z.array(z.string().min(1)).min(1);
const searchTerm = z.string();
export const CreateInviteListSchema = z
  .object({
    name: listName.openapi({
      description:
        '1–100 characters after trimming, unique per creator ignoring case.',
    }),
    personIds: personIds.openapi({
      description:
        'Stable IDs of existing users; duplicates collapse. At most 100 distinct people.',
    }),
  })
  .strict()
  .openapi('CreateInviteList');
export const UpdateInviteListSchema = CreateInviteListSchema.partial()
  .refine(body => body.name !== undefined || body.personIds !== undefined, {
    message: 'Provide a name or people to update',
  })
  .openapi('UpdateInviteList');
export const DeleteInviteListSchema = z
  .object({ deleted: z.literal(true), inviteListId: z.string() })
  .openapi('DeleteInviteListResult');
export const InviteListIdParamSchema = z.object({ inviteListId: z.string() });
export const InviteListSearchQuerySchema = z.object({
  q: searchTerm.openapi({
    description:
      'Username search, minimum two characters after trimming. Returns at most ten visible existing people.',
  }),
});
export const InviteListSendSchema = z
  .object({
    eventId: z.string().min(1),
    role: z.enum(['ATTENDEE', 'MODERATOR']).optional(),
    message: z.string().max(480).optional(),
  })
  .strict()
  .openapi('InviteListSend');
export const InviteListSendResultSchema = z
  .object({
    eventId: z.string(),
    totalCount: z.number(),
    sentCount: z.number(),
    skippedCount: z.number(),
    results: z.array(
      z.discriminatedUnion('status', [
        z.object({
          personId: z.string(),
          status: z.literal('sent'),
          inviteId: z.string(),
        }),
        z.object({
          personId: z.string(),
          status: z.literal('skipped'),
          reason: z.enum([
            'ALREADY_MEMBER',
            'INVITATION_PENDING',
            'UNAVAILABLE',
          ]),
        }),
      ])
    ),
  })
  .openapi('InviteListSendResult');
const protectedRequestId = z.string().optional().openapi({
  description:
    'Optional protected retry ID: <unix-ms>.<uuid-v4>. Valid for 24 hours; reuse the original ID and exact inputs after uncertain outcomes.',
});
export const InviteListSendHeadersSchema = z.object({
  'Idempotency-Key': protectedRequestId,
});
