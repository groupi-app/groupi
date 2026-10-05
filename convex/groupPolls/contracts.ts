import { v } from 'convex/values';
import { tool, visibility } from '../groupTools/contracts';
export const mode = v.union(v.literal('SINGLE'), v.literal('MULTIPLE'));
export const option = v.object({ id: v.string(), label: v.string() });
export const configInput = {
  title: v.string(),
  description: v.optional(v.string()),
  mode,
  options: v.array(option),
};
export const createInput = {
  groupId: v.id('groups'),
  ...configInput,
  resultsVisibility: visibility,
};
export const voteFields = {
  toolId: v.id('groupTools'),
  groupId: v.id('groups'),
  personId: v.optional(v.id('persons')),
  revision: v.number(),
  version: v.number(),
  semanticVersion: v.number(),
  mode,
  options: v.array(option),
  selections: v.array(v.string()),
  removed: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
};
export const vote = v.object({
  _id: v.id('groupPollVotes'),
  _creationTime: v.number(),
  ...voteFields,
  isCurrent: v.boolean(),
});
export const revision = v.object({
  _id: v.id('groupPollRevisions'),
  _creationTime: v.number(),
  ...voteFields,
});
export const poll = v.object({
  ...tool.fields,
  version: v.number(),
  semanticVersion: v.number(),
  mode,
  options: v.array(option),
  selections: v.array(v.string()),
  savedOptions: v.array(option),
  savedVersion: v.union(v.number(), v.null()),
  voteRevision: v.number(),
  canManage: v.boolean(),
  canReview: v.boolean(),
  enabled: v.boolean(),
});
export const managementPoll = v.object({
  ...tool.fields,
  version: v.number(),
  semanticVersion: v.number(),
  mode,
  options: v.array(option),
  canManage: v.literal(true),
});
export const votePage = v.object({
  page: v.array(vote),
  isDone: v.boolean(),
  continueCursor: v.string(),
});
export const historyPage = v.object({
  voteRevision: v.number(),
  page: v.array(revision),
  isDone: v.boolean(),
  continueCursor: v.string(),
});
