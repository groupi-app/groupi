import { v } from 'convex/values';
import {
  questionValidator,
  answersValidator,
  applicationStatusValidator,
  decisionValidator,
} from '../eventApplications/contracts';
export { questionValidator, answersValidator, applicationStatusValidator };
export const application = v.object({
  _id: v.id('groupApplications'),
  _creationTime: v.number(),
  groupId: v.id('groups'),
  personId: v.id('persons'),
  questions: v.array(questionValidator),
  answers: answersValidator,
  status: applicationStatusValidator,
  submittedAt: v.number(),
  updatedAt: v.number(),
  decisions: v.array(decisionValidator),
});
export const result = v.object({
  applicationId: v.id('groupApplications'),
  status: applicationStatusValidator,
});
export const form = v.object({
  applicationsEnabled: v.boolean(),
  questions: v.array(questionValidator),
  pending: v.union(application, v.null()),
  canApply: v.boolean(),
  canReview: v.boolean(),
});
export const page = v.object({
  page: v.array(application),
  isDone: v.boolean(),
  continueCursor: v.string(),
});
export const reviewer = v.object({
  ...application.fields,
  applicant: v.object({
    personId: v.id('persons'),
    name: v.union(v.string(), v.null()),
    username: v.union(v.string(), v.null()),
    image: v.union(v.string(), v.null()),
  }),
});
export const reviewPage = v.object({ ...page.fields, page: v.array(reviewer) });
