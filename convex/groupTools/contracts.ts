import { v } from 'convex/values';
/** Storage discriminator extended by independently implemented interaction slices. */
export const kind = v.union(
  v.literal('FORM'),
  v.literal('POLL'),
  v.literal('LIST')
);
export const visibility = v.union(v.literal('MANAGERS'), v.literal('MEMBERS'));
export const creation = v.union(v.literal('MANAGERS'), v.literal('MEMBERS'));
export const policyFields = {
  groupId: v.id('groups'),
  kind,
  enabled: v.boolean(),
  creation,
};
export const toolFields = {
  groupId: v.id('groups'),
  kind,
  title: v.string(),
  description: v.string(),
  resultsVisibility: visibility,
  creatorId: v.optional(v.id('persons')),
  createdAt: v.number(),
  updatedAt: v.number(),
};
export const tool = v.object({
  _id: v.id('groupTools'),
  _creationTime: v.number(),
  ...toolFields,
});
