import { z } from '@hono/zod-openapi';
export const GroupApplicationQuestionSchema = z
  .object({
    id: z.string().min(1).max(100),
    label: z.string().min(1).max(1000),
    required: z.boolean(),
    type: z.enum([
      'SHORT_ANSWER',
      'LONG_ANSWER',
      'MULTIPLE_CHOICE',
      'CHECKBOXES',
      'NUMBER',
      'DROPDOWN',
      'YES_NO',
    ]),
    options: z.array(z.string().min(1).max(500)).max(100).optional(),
  })
  .strict();
export const GroupApplicationAnswersSchema = z.record(
  z.string().max(100),
  z.union([
    z.string().max(10000),
    z.number().finite(),
    z.boolean(),
    z.array(z.string().max(500)).max(100),
  ])
);
export const GroupApplicationStatusSchema = z.enum([
  'PENDING',
  'WITHDRAWN',
  'APPROVED',
  'DECLINED',
]);
export const GroupApplicationSchema = z.object({
  _id: z.string(),
  _creationTime: z.number(),
  groupId: z.string(),
  personId: z.string(),
  questions: z.array(GroupApplicationQuestionSchema),
  answers: GroupApplicationAnswersSchema,
  status: GroupApplicationStatusSchema,
  submittedAt: z.number(),
  updatedAt: z.number(),
  decisions: z.array(
    z.object({
      status: GroupApplicationStatusSchema,
      actorId: z.string().optional(),
      at: z.number(),
      reason: z.string().optional(),
    })
  ),
});
export const GroupApplicationFormSchema = z.object({
  applicationsEnabled: z.boolean(),
  questions: z.array(GroupApplicationQuestionSchema),
  pending: GroupApplicationSchema.nullable(),
  canApply: z.boolean(),
  canReview: z.boolean(),
});
export const GroupApplicationResultSchema = z.object({
  applicationId: z.string(),
  status: GroupApplicationStatusSchema,
  joiningQuestionnaire: z
    .object({
      requiredCompletion: z.boolean(),
      requiresCompletion: z.boolean(),
      canAccessMemberContent: z.boolean(),
      enabled: z.boolean(),
      completed: z.boolean(),
      shouldPrompt: z.boolean(),
      version: z.number().int().nonnegative(),
    })
    .optional(),
});
