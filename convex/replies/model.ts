import { v } from 'convex/values';
import schema from '../schema';
import { attachmentInputValidator } from '../attachments/model';
export const replyDocument = v.object({
  _id: v.id('replies'),
  _creationTime: v.number(),
  ...schema.tables.replies.validator.fields,
});
export const createReplyArgs = v.object({
  postId: v.id('posts'),
  text: v.string(),
  attachments: v.optional(v.array(attachmentInputValidator)),
  _traceId: v.optional(v.string()),
});
export const updateReplyArgs = v.object({
  replyId: v.id('replies'),
  text: v.string(),
  attachmentsToAdd: v.optional(v.array(attachmentInputValidator)),
  attachmentIdsToDelete: v.optional(v.array(v.id('attachments'))),
  _traceId: v.optional(v.string()),
});
export const deleteReplyArgs = v.object({
  replyId: v.id('replies'),
  _traceId: v.optional(v.string()),
});
