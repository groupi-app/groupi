import { v } from 'convex/values';
import { tool, visibility } from '../groupTools/contracts';
export const config = {
  title: v.string(),
  description: v.optional(v.string()),
};
export const createInput = {
  groupId: v.id('groups'),
  ...config,
  resultsVisibility: visibility,
};
export const entryFields = {
  toolId: v.id('groupTools'),
  groupId: v.id('groups'),
  personId: v.optional(v.id('persons')),
  actorId: v.optional(v.id('persons')),
  listTitle: v.string(),
  text: v.string(),
  completed: v.boolean(),
  revision: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
};
export const entry = v.object({
  _id: v.id('groupListEntries'),
  _creationTime: v.number(),
  ...entryFields,
});
export const settings = v.object({
  ...tool.fields,
  version: v.number(),
  canManage: v.boolean(),
});
export const entryPage = v.object({
  page: v.array(
    v.object({ ...entry.fields, canEdit: v.boolean(), canRemove: v.boolean() })
  ),
  isDone: v.boolean(),
  continueCursor: v.string(),
});
export const toolPage = v.object({
  page: v.array(tool),
  isDone: v.boolean(),
  continueCursor: v.string(),
});
export const addResult = v.object({
  entryId: v.id('groupListEntries'),
  state: v.union(v.literal('PRESENT'), v.literal('REMOVED')),
});
