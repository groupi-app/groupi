import { v } from 'convex/values';
import type { QueryCtx } from '../_generated/server';
import type { Doc } from '../_generated/dataModel';
import { discussionAuthor, readDiscussionAuthor } from '../posts/presentation';

export const replySummary = v.object({
  id: v.id('replies'),
  text: v.string(),
  createdAt: v.number(),
  updatedAt: v.union(v.number(), v.null()),
  author: discussionAuthor,
});
export const replyDetail = v.object({
  ...replySummary.fields,
  postId: v.id('posts'),
});

export async function readReplySummary(ctx: QueryCtx, reply: Doc<'replies'>) {
  return {
    id: reply._id,
    text: reply.text,
    createdAt: reply._creationTime,
    updatedAt: reply.updatedAt ?? null,
    author: await readDiscussionAuthor(ctx, reply.authorId),
  };
}
