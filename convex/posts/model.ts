import { v } from 'convex/values';
import schema from '../schema';
import { attachmentInputValidator } from '../attachments/model';
export const postDocument = v.object({
  _id: v.id('posts'),
  _creationTime: v.number(),
  ...schema.tables.posts.validator.fields,
});
export const createPostArgs = v.object({
  eventId: v.id('events'),
  title: v.string(),
  content: v.string(),
  attachments: v.optional(v.array(attachmentInputValidator)),
  _traceId: v.optional(v.string()),
});
export const updatePostArgs = v.object({
  postId: v.id('posts'),
  title: v.optional(v.string()),
  content: v.optional(v.string()),
  attachmentsToAdd: v.optional(v.array(attachmentInputValidator)),
  attachmentIdsToDelete: v.optional(v.array(v.id('attachments'))),
  _traceId: v.optional(v.string()),
});
export const deletePostArgs = v.object({
  postId: v.id('posts'),
  _traceId: v.optional(v.string()),
});
