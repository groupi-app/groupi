import { v } from 'convex/values';
import { contextFields } from '../groupTools/contracts';
import { tool, visibility } from '../groupTools/contracts';
export const listType = v.union(
  v.literal('SIMPLE'),
  v.literal('CHECKLIST'),
  v.literal('BRING')
);
export const addPolicy = v.union(
  v.literal('PARTICIPANTS'),
  v.literal('CREATOR_MANAGERS')
);
export const completionPolicy = v.union(
  v.literal('PARTICIPANTS'),
  v.literal('AUTHORS'),
  v.literal('CREATOR_MANAGERS')
);
export const optionFields = {
  listType: v.optional(listType),
  addPolicy: v.optional(addPolicy),
  completionPolicy: v.optional(completionPolicy),
};
export const config = {
  ...optionFields,
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
  ...contextFields,
  personId: v.optional(v.id('persons')),
  actorId: v.optional(v.id('persons')),
  listTitle: v.string(),
  text: v.string(),
  completed: v.boolean(),
  completedById: v.optional(v.id('persons')),
  completedAt: v.optional(v.number()),
  quantity: v.optional(v.number()),
  claimedQuantity: v.optional(v.number()),
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
  listType,
  addPolicy,
  completionPolicy,
  canManage: v.boolean(),
  canConfigure: v.boolean(),
  canDelete: v.boolean(),
  canAdd: v.boolean(),
  hasEntries: v.boolean(),
});
export const entryPage = v.object({
  page: v.array(
    v.object({
      ...entry.fields,
      canEdit: v.boolean(),
      canRemove: v.boolean(),
      canComplete: v.boolean(),
      addedByName: v.optional(v.string()),
      completedByName: v.optional(v.string()),
    })
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

export const claimFields = {
  toolId: v.id('groupTools'),
  entryId: v.id('groupListEntries'),
  ...contextFields,
  personId: v.id('persons'),
  quantity: v.number(),
  revision: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
};
