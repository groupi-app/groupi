import { v } from 'convex/values';
export const postFields = {
  groupId: v.id('groups'),
  authorId: v.optional(v.id('persons')),
  title: v.string(),
  content: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
};
export const post = v.object({
  _id: v.id('groupPosts'),
  _creationTime: v.number(),
  ...postFields,
  authorName: v.string(),
  canEdit: v.boolean(),
  canDelete: v.boolean(),
});

export const reply = v.object({
  _id: v.id('groupPostReplies'),
  _creationTime: v.number(),
  groupId: v.id('groups'),
  postId: v.id('groupPosts'),
  authorId: v.optional(v.id('persons')),
  content: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
  authorName: v.string(),
  canEdit: v.boolean(),
  canDelete: v.boolean(),
});
