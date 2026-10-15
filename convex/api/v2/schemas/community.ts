import { z } from '@hono/zod-openapi';
import { GroupApplicationAnswersSchema } from './groupApplications';
import { GroupApplicationQuestionSchema } from './groupApplications';
const status = z.enum(['PENDING', 'WITHDRAWN', 'APPROVED', 'DECLINED']);
export const CommunityContextSchema = z.object({
  contractVersion: z.literal('red-room.v1'),
  group: z.object({ id: z.string(), name: z.string() }),
  form: z.object({
    enabled: z.boolean(),
    revision: z.string(),
    questions: z.array(GroupApplicationQuestionSchema),
  }),
  membership: z
    .object({ role: z.enum(['OWNER', 'MODERATOR', 'MEMBER']) })
    .nullable(),
  eligibility: z.object({
    canApply: z.boolean(),
    canAccessMemberContent: z.boolean(),
    banned: z.boolean(),
  }),
  applications: z.array(
    z.object({
      id: z.string(),
      status,
      revision: z.number(),
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
    supported: z.literal(false),
    subscribed: z.null(),
  }),
});

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
