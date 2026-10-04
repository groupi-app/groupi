import { v } from 'convex/values';
export const questionValidator = v.object({
  id: v.string(),
  label: v.string(),
  required: v.boolean(),
  type: v.union(
    v.literal('SHORT_ANSWER'),
    v.literal('LONG_ANSWER'),
    v.literal('MULTIPLE_CHOICE'),
    v.literal('CHECKBOXES'),
    v.literal('NUMBER'),
    v.literal('DROPDOWN'),
    v.literal('YES_NO')
  ),
  options: v.optional(v.array(v.string())),
});
export const reviewerPolicyValidator = v.union(
  v.literal('ORGANIZERS_AND_MODERATORS'),
  v.literal('ORGANIZER_ONLY')
);
export const applicationSettingsValidator = v.object({
  questions: v.array(questionValidator),
  reviewerPolicy: reviewerPolicyValidator,
});
export const applicationStatusValidator = v.union(
  v.literal('PENDING'),
  v.literal('WITHDRAWN'),
  v.literal('APPROVED'),
  v.literal('DECLINED')
);
export const answerValidator = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.array(v.string())
);
export const answersValidator = v.record(v.string(), answerValidator);
export const decisionValidator = v.object({
  status: applicationStatusValidator,
  actorId: v.optional(v.id('persons')),
  at: v.number(),
  reason: v.optional(v.string()),
});
export const applicationValidator = v.object({
  _id: v.id('eventApplications'),
  _creationTime: v.number(),
  eventId: v.id('events'),
  personId: v.id('persons'),
  questions: v.array(questionValidator),
  answers: answersValidator,
  status: applicationStatusValidator,
  submittedAt: v.number(),
  updatedAt: v.number(),
  decisions: v.array(decisionValidator),
});
export const applicationResultValidator = v.object({
  applicationId: v.id('eventApplications'),
  status: applicationStatusValidator,
});
export const applicationFormValidator = v.object({
  settings: applicationSettingsValidator,
  pending: v.union(applicationValidator, v.null()),
  canApply: v.boolean(),
  canReview: v.boolean(),
});
export const applicationPageValidator = v.object({
  page: v.array(applicationValidator),
  isDone: v.boolean(),
  continueCursor: v.string(),
  splitCursor: v.optional(v.union(v.string(), v.null())),
  pageStatus: v.optional(
    v.union(v.literal('SplitRecommended'), v.literal('SplitRequired'), v.null())
  ),
});
export const applicationReviewerValidator = v.object({
  ...applicationValidator.fields,
  applicant: v.object({
    personId: v.id('persons'),
    name: v.union(v.string(), v.null()),
    username: v.union(v.string(), v.null()),
    image: v.union(v.string(), v.null()),
  }),
});
export const applicationReviewPageValidator = v.object({
  ...applicationPageValidator.fields,
  page: v.array(applicationReviewerValidator),
});
