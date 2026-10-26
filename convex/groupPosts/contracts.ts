import { v } from 'convex/values';
import schema from '../schema';
import { attachmentWithUrlValidator } from '../attachments/model';
import { discussionAuthor } from '../posts/presentation';
const baseAuthor = discussionAuthor.members[0];
const authorUser = v.object({
  ...baseAuthor.fields.user.fields,
  _id: v.string(),
});
const author = v.union(
  v.object({
    ...baseAuthor.fields,
    user: authorUser,
    person: v.object({
      _id: v.union(v.id('persons'), v.id('authorizationPrincipals')),
      user: authorUser,
    }),
  }),
  v.null()
);
export const post = v.object({
  _id: v.id('posts'),
  _creationTime: v.number(),
  ...schema.tables.posts.validator.fields,
  groupId: v.id('groups'),
  createdAt: v.number(),
  authorName: v.string(),
  author,
  canEdit: v.boolean(),
  canDelete: v.boolean(),
  canModerate: v.boolean(),
  viewerPersonId: v.id('persons'),
  unreadCount: v.number(),
  attachments: v.array(attachmentWithUrlValidator),
  replyCount: v.number(),
});
export const reply = v.object({
  _id: v.id('replies'),
  _creationTime: v.number(),
  ...schema.tables.replies.validator.fields,
  groupId: v.id('groups'),
  content: v.string(),
  createdAt: v.number(),
  authorName: v.string(),
  author,
  canEdit: v.boolean(),
  canDelete: v.boolean(),
  attachments: v.array(attachmentWithUrlValidator),
});
