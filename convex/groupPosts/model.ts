import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { requireGroupMemberContent } from '../groups/contentAccess';
import { membershipFor } from '../groups/policy';
import { livePerson } from '../groups/model';
type ReadCtx = QueryCtx | MutationCtx;
function clean(title: string, content: string) {
  title = title.trim();
  content = content.trim();
  if (!title || title.length > 200 || !content || content.length > 50000)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message:
        'Use a title of 1–200 characters and post text of 1–50,000 characters.',
    });
  return { title, content };
}
export async function present(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  row: Doc<'groupPosts'>
) {
  const member = await membershipFor(ctx, row.groupId, personId);
  const author = row.authorId ? await livePerson(ctx, row.authorId) : null;
  const canEdit =
    row.authorId === personId ||
    member?.role === 'OWNER' ||
    member?.role === 'MODERATOR';
  return {
    ...row,
    authorName: author?.user.name || author?.user.username || 'Former member',
    canEdit,
    canDelete:
      canEdit || member?.role === 'OWNER' || member?.role === 'MODERATOR',
  };
}
export async function get(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  postId: Id<'groupPosts'>
) {
  const row = await ctx.db.get(postId);
  if (!row) return null;
  await requireGroupMemberContent(ctx, row.groupId, personId);
  return present(ctx, personId, row);
}
export async function create(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  input: { groupId: Id<'groups'>; title: string; content: string }
) {
  await requireGroupMemberContent(ctx, input.groupId, personId);
  const now = Date.now();
  return ctx.db.insert('groupPosts', {
    groupId: input.groupId,
    authorId: personId,
    ...clean(input.title, input.content),
    createdAt: now,
    updatedAt: now,
  });
}
export async function update(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  input: { postId: Id<'groupPosts'>; title: string; content: string }
) {
  const row = await get(ctx, personId, input.postId);
  if (!row || !row.canEdit)
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'Only the author or current Group managers can edit this post.',
    });
  await ctx.db.patch(input.postId, {
    ...clean(input.title, input.content),
    updatedAt: Date.now(),
  });
  return null;
}
export async function remove(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  postId: Id<'groupPosts'>
) {
  const row = await get(ctx, personId, postId);
  if (!row) return null;
  if (!row.canDelete)
    throw new ConvexError({
      code: 'FORBIDDEN',
      message:
        'Only the author or current Group managers can delete this post.',
    });
  for await (const reply of ctx.db
    .query('groupPostReplies')
    .withIndex('by_postId', q => q.eq('postId', postId)))
    await ctx.db.delete(reply._id);
  await ctx.db.delete(postId);
  return null;
}
export async function removeForGroup(ctx: MutationCtx, groupId: Id<'groups'>) {
  for await (const row of ctx.db
    .query('groupPostReplies')
    .withIndex('by_groupId', q => q.eq('groupId', groupId)))
    await ctx.db.delete(row._id);
  for await (const row of ctx.db
    .query('groupPosts')
    .withIndex('by_groupId', q => q.eq('groupId', groupId)))
    await ctx.db.delete(row._id);
}
export async function removeForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>
) {
  for await (const row of ctx.db
    .query('groupPostReplies')
    .withIndex('by_authorId', q => q.eq('authorId', personId)))
    await ctx.db.patch(row._id, { authorId: undefined });
  for await (const row of ctx.db
    .query('groupPosts')
    .withIndex('by_authorId', q => q.eq('authorId', personId)))
    await ctx.db.patch(row._id, { authorId: undefined });
}

export async function presentReply(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  row: Doc<'groupPostReplies'>
) {
  const member = await membershipFor(ctx, row.groupId, personId);
  const author = row.authorId ? await livePerson(ctx, row.authorId) : null;
  const canEdit =
    row.authorId === personId ||
    member?.role === 'OWNER' ||
    member?.role === 'MODERATOR';
  return {
    ...row,
    authorName: author?.user.name || author?.user.username || 'Former member',
    canEdit,
    canDelete: canEdit,
  };
}
export async function createReply(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  postId: Id<'groupPosts'>,
  content: string
) {
  const post = await get(ctx, personId, postId);
  if (!post)
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Post unavailable.' });
  const data = clean('Reply', content);
  const now = Date.now();
  return ctx.db.insert('groupPostReplies', {
    groupId: post.groupId,
    postId,
    authorId: personId,
    content: data.content,
    createdAt: now,
    updatedAt: now,
  });
}
async function editableReply(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  replyId: Id<'groupPostReplies'>
) {
  const row = await ctx.db.get(replyId);
  if (!row)
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Reply unavailable.' });
  await requireGroupMemberContent(ctx, row.groupId, personId);
  const reply = await presentReply(ctx, personId, row);
  if (!reply.canEdit)
    throw new ConvexError({
      code: 'FORBIDDEN',
      message:
        'Only the author or current Group managers can change this reply.',
    });
  return reply;
}
export async function updateReply(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  replyId: Id<'groupPostReplies'>,
  content: string
) {
  await editableReply(ctx, personId, replyId);
  await ctx.db.patch(replyId, {
    content: clean('Reply', content).content,
    updatedAt: Date.now(),
  });
  return null;
}
export async function deleteReply(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  replyId: Id<'groupPostReplies'>
) {
  await editableReply(ctx, personId, replyId);
  await ctx.db.delete(replyId);
  return null;
}
