import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { discussionPermissions } from '../lib/discussionAccess';
import { readDiscussionAuthor } from '../posts/presentation';
import {
  createPostForPerson,
  updatePostForPerson,
  deletePostForPerson,
  purgePost,
} from '../posts/writes';
import {
  createReplyForPerson,
  updateReplyForPerson,
  deleteReplyForPerson,
} from '../replies/writes';
import type { AttachmentInput } from '../attachments/model';
type ReadCtx = QueryCtx | MutationCtx;
export function groupPost<
  T extends { groupId?: Id<'groups'>; eventId?: Id<'events'> },
>(row: T) {
  if (!row.groupId || row.eventId)
    throw new ConvexError({
      code: 'NOT_FOUND',
      message: 'Group post not found.',
    });
  return { ...row, groupId: row.groupId };
}
async function author(ctx: ReadCtx, authorId: Doc<'posts'>['authorId']) {
  const value = await readDiscussionAuthor(ctx, authorId);
  return value
    ? {
        ...value,
        user: { ...value.user, email: null, _id: value.user.id },
        person: {
          _id: value.id,
          user: { ...value.user, email: null, _id: value.user.id },
        },
      }
    : null;
}
async function attachments(
  ctx: ReadCtx,
  parent: { postId: Id<'posts'> } | { replyId: Id<'replies'> }
) {
  const rows =
    'postId' in parent
      ? await ctx.db
          .query('attachments')
          .withIndex('by_post', q => q.eq('postId', parent.postId))
          .collect()
      : await ctx.db
          .query('attachments')
          .withIndex('by_reply', q => q.eq('replyId', parent.replyId))
          .collect();
  return Promise.all(
    rows.map(async row => ({
      ...row,
      url: await ctx.storage.getUrl(row.storageId),
    }))
  );
}
export async function present(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  stored: Doc<'posts'>
) {
  const row = groupPost(stored);
  const permissions = await discussionPermissions(ctx, row, personId);
  const by = await author(ctx, row.authorId);
  const canEdit = row.authorId === personId || permissions.canManage;
  return {
    ...row,
    createdAt: row._creationTime,
    author: by,
    authorName: by?.user.name || by?.user.username || 'Former member',
    canEdit,
    canDelete: canEdit,
    canModerate: permissions.canManage,
    viewerPersonId: personId,
    unreadCount: (
      await ctx.db
        .query('notifications')
        .withIndex('by_person_read', q =>
          q.eq('personId', personId).eq('read', false)
        )
        .collect()
    ).filter(notification => notification.postId === row._id).length,
    attachments: await attachments(ctx, { postId: row._id }),
    replyCount: (
      await ctx.db
        .query('replies')
        .withIndex('by_post', q => q.eq('postId', row._id))
        .collect()
    ).length,
  };
}
export async function get(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  postId: Id<'posts'>
) {
  const row = await ctx.db.get(postId);
  return row ? present(ctx, personId, row) : null;
}
export async function create(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  input: {
    groupId: Id<'groups'>;
    title: string;
    content: string;
    attachments?: AttachmentInput[];
  }
) {
  return (await createPostForPerson(ctx, personId, input)).postId;
}
export async function update(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  input: {
    postId: Id<'posts'>;
    title?: string;
    content?: string;
    attachmentsToAdd?: AttachmentInput[];
    attachmentIdsToDelete?: Id<'attachments'>[];
  }
) {
  const row = await ctx.db.get(input.postId);
  if (!row)
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Post not found.' });
  groupPost(row);
  await updatePostForPerson(ctx, personId, input);
  return null;
}
export async function remove(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  postId: Id<'posts'>
) {
  const row = await ctx.db.get(postId);
  if (!row) return null;
  groupPost(row);
  await deletePostForPerson(ctx, personId, { postId });
  return null;
}
export async function removeForGroup(ctx: MutationCtx, groupId: Id<'groups'>) {
  for await (const row of ctx.db
    .query('posts')
    .withIndex('by_groupId', q => q.eq('groupId', groupId)))
    await purgePost(ctx, row._id);
}
export async function presentReply(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  row: Doc<'replies'>
) {
  const parent = await ctx.db.get(row.postId);
  if (!parent)
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Post not found.' });
  const post = groupPost(parent),
    permissions = await discussionPermissions(ctx, post, personId),
    by = await author(ctx, row.authorId);
  const canEdit = row.authorId === personId || permissions.canManage;
  return {
    ...row,
    groupId: post.groupId,
    content: row.text,
    createdAt: row._creationTime,
    author: by,
    authorName: by?.user.name || by?.user.username || 'Former member',
    canEdit,
    canDelete: canEdit,
    attachments: await attachments(ctx, { replyId: row._id }),
  };
}
export async function createReply(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  postId: Id<'posts'>,
  content: string,
  attachments?: AttachmentInput[]
) {
  const post = await get(ctx, personId, postId);
  if (!post)
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Post unavailable.' });
  return (
    await createReplyForPerson(ctx, personId, {
      postId,
      text: content,
      attachments,
    })
  ).replyId;
}
export async function updateReply(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  replyId: Id<'replies'>,
  content: string,
  attachmentsToAdd?: AttachmentInput[],
  attachmentIdsToDelete?: Id<'attachments'>[]
) {
  const row = await ctx.db.get(replyId);
  if (!row)
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Reply unavailable.' });
  await get(ctx, personId, row.postId);
  await updateReplyForPerson(ctx, personId, {
    replyId,
    text: content,
    attachmentsToAdd,
    attachmentIdsToDelete,
  });
  return null;
}
export async function deleteReply(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  replyId: Id<'replies'>
) {
  const row = await ctx.db.get(replyId);
  if (!row)
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Reply unavailable.' });
  await get(ctx, personId, row.postId);
  await deleteReplyForPerson(ctx, personId, { replyId });
  return null;
}
