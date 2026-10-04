import { v } from 'convex/values';
import {
  questionValidator,
  answerValidator,
  answersValidator,
} from '../eventApplications/contracts';
export const question = v.object({
  ...questionValidator.fields,
  version: v.number(),
});
export const configuration = v.object({
  groupId: v.id('groups'),
  enabled: v.boolean(),
  version: v.number(),
  questions: v.array(question),
  updatedAt: v.number(),
});
export const record = v.object({
  version: v.number(),
  groupId: v.id('groups'),
  personId: v.id('persons'),
  savedQuestions: v.array(question),
  updatedAt: v.number(),
});
export const answerFields = {
  groupId: v.id('groups'),
  personId: v.id('persons'),
  question,
  answer: v.optional(answerValidator),
  answeredAt: v.number(),
};
export const status = v.object({
  enabled: v.boolean(),
  completed: v.boolean(),
  shouldPrompt: v.boolean(),
  version: v.number(),
});
export const form = v.object({
  ...status.fields,
  groupId: v.id('groups'),
  questions: v.array(question),
  answers: answersValidator,
  savedQuestions: v.array(question),
  canEdit: v.boolean(),
  canConfigure: v.boolean(),
  canReview: v.boolean(),
});
export const author = v.object({
  personId: v.id('persons'),
  name: v.union(v.string(), v.null()),
  username: v.union(v.string(), v.null()),
  image: v.union(v.string(), v.null()),
});
export const review = v.object({ ...form.fields, author });
export const reviewPage = v.object({
  page: v.array(review),
  isDone: v.boolean(),
  continueCursor: v.string(),
});
export const historyEntry = v.object({
  _id: v.id('groupQuestionnaireHistory'),
  _creationTime: v.number(),
  ...answerFields,
});
export const historyPage = v.object({
  page: v.array(historyEntry),
  isDone: v.boolean(),
  continueCursor: v.string(),
});
