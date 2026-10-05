import { v } from 'convex/values';
import {
  questionValidator,
  answersValidator,
} from '../eventApplications/contracts';
import { visibility, tool } from '../groupTools/contracts';
export const configInput = {
  title: v.string(),
  description: v.optional(v.string()),
  questions: v.array(questionValidator),
};
export const createInput = {
  groupId: v.id('groups'),
  ...configInput,
  resultsVisibility: visibility,
};
export const responseFields = {
  toolId: v.id('groupTools'),
  groupId: v.id('groups'),
  personId: v.optional(v.id('persons')),
  revision: v.number(),
  version: v.number(),
  questions: v.array(questionValidator),
  answers: answersValidator,
  createdAt: v.number(),
  updatedAt: v.number(),
};
export const response = v.object({
  _id: v.id('groupFormResponses'),
  _creationTime: v.number(),
  ...responseFields,
});
export const revision = v.object({
  _id: v.id('groupFormRevisions'),
  _creationTime: v.number(),
  ...responseFields,
});
export const form = v.object({
  ...tool.fields,
  version: v.number(),
  questions: v.array(questionValidator),
  answers: answersValidator,
  savedQuestions: v.array(questionValidator),
  savedVersion: v.union(v.number(), v.null()),
  responseRevision: v.number(),
  canManage: v.boolean(),
  canReview: v.boolean(),
  enabled: v.boolean(),
});
export const responsePage = v.object({
  page: v.array(response),
  isDone: v.boolean(),
  continueCursor: v.string(),
});
export const historyPage = v.object({
  page: v.array(revision),
  isDone: v.boolean(),
  continueCursor: v.string(),
});

/** Current manager configuration, without response/result data. */
export const managementForm = v.object({
  ...tool.fields,
  version: v.number(),
  questions: v.array(questionValidator),
  canManage: v.literal(true),
});
