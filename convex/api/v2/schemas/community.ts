import { z } from '@hono/zod-openapi';
import { GroupApplicationAnswersSchema } from './groupApplications';
import { GroupApplicationQuestionSchema } from './groupApplications';
const status = z.enum(['PENDING', 'WITHDRAWN', 'APPROVED', 'DECLINED']);
export const CommunityContextSchema = z.object({
  contractVersion: z.literal('community.v1'),
  group: z.object({ id: z.string(), name: z.string() }),
  form: z.object({
    enabled: z.boolean(),
    revision: z.string(),
    questions: z.array(GroupApplicationQuestionSchema),
  }),
  membership: z
    .object({
      membershipId: z.string(),
      role: z.enum(['OWNER', 'MODERATOR', 'MEMBER']),
    })
    .nullable(),
  eligibility: z.object({
    canApply: z.boolean(),
    canAccessMemberContent: z.boolean(),
    banned: z.boolean(),
    excluded: z.boolean(),
  }),
  applications: z.array(
    z.object({
      id: z.string(),
      status,
      revision: z.number(),
      decisionDelivery: z
        .enum(['queued', 'sending', 'sent', 'failed', 'suppressed'])
        .optional(),
      questions: z.array(GroupApplicationQuestionSchema),
      answers: z.record(
        z.string(),
        z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
      ),
      submittedAt: z.number(),
      decisions: z.array(z.object({ status, at: z.number() })),
    })
  ),
  nextCursor: z.string().nullable(),
  grantedActions: z.array(z.string()),
  allowedActions: z.array(z.string()),
  announcementPreference: z.object({
    supported: z.literal(true),
    subscribed: z.boolean(),
  }),
});

export const CurrentCommunityEventSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }),
  z.object({
    kind: z.literal('conflict'),
    code: z.literal('STAFF_CONFIGURATION_CONFLICT'),
  }),
  z.object({
    kind: z.literal('event'),
    supportedRsvpChoices: z.array(z.enum(['PENDING', 'YES', 'NO', 'MAYBE'])),
    allowedRsvpTransitions: z.array(z.enum(['PENDING', 'YES', 'NO', 'MAYBE'])),
    event: z.object({
      id: z.string(),
      title: z.string(),
      location: z.string().nullable(),
      description: z.string().nullable(),
      timezone: z.string(),
      startsAt: z.number().nullable(),
      endsAt: z.number().nullable(),
      ongoing: z.boolean(),
      roster: z.array(z.object({ displayName: z.string() })).nullable(),
    }),
    participation: z
      .object({
        membershipId: z.string(),
        revision: z.number(),
        rsvp: z.enum(['PENDING', 'YES', 'NO', 'MAYBE']),
      })
      .nullable(),
    allowedActions: z.array(z.string()),
  }),
]);
export const CommunityApplicationReceiptSchema = z.object({
  operationId: z.string().uuid(),
  outcome: z.literal('committed'),
  result: z.object({ applicationId: z.string(), status, revision: z.number() }),
  effects: z.object({
    email: z.literal('not-requested'),
    cleanup: z.literal('not-requested'),
  }),
});
export const CommunityApplicationSubmitSchema = z
  .object({ formRevision: z.string(), answers: GroupApplicationAnswersSchema })
  .strict();
export const CommunityApplicationEditSchema = z
  .object({
    expectedRevision: z.number().int().nonnegative(),
    answers: GroupApplicationAnswersSchema,
  })
  .strict();
export const CommunityApplicationWithdrawSchema = z
  .object({ expectedRevision: z.number().int().nonnegative() })
  .strict();

const participation = z.object({
  membershipId: z.string(),
  revision: z.number(),
  rsvp: z.enum(['PENDING', 'YES', 'NO', 'MAYBE']),
});
const effects = z.object({
  email: z.literal('not-requested'),
  cleanup: z.literal('not-requested'),
});
const receiptBase = z.object({
  operationId: z.string().uuid(),
  outcome: z.literal('committed'),
  effects,
});
export const CommunityParticipationReceiptSchema = receiptBase.extend({
  result: z.object({ eventId: z.string(), participation }),
});
export const CommunityEventLeaveReceiptSchema = receiptBase.extend({
  result: z.object({ eventId: z.string(), participation: z.null() }),
});
export const CommunityLeaveReceiptSchema = receiptBase.extend({
  result: z.object({
    membership: z.null(),
    retainsIndependentEventParticipation: z.literal(true),
  }),
});
export const CommunityJoinSchema = z.object({}).strict();
export const CommunityRsvpSchema = z
  .object({
    expectedRevision: z.number().int().nonnegative(),
    rsvp: z.enum(['PENDING', 'YES', 'NO', 'MAYBE']),
  })
  .strict();
export const CommunityEventLeaveSchema = z
  .object({ expectedRevision: z.number().int().nonnegative() })
  .strict();
export const CommunityLeaveSchema = z
  .object({ expectedMembershipId: z.string() })
  .strict();
