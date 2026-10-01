import {
  internalQuery,
  internalMutation,
  type QueryCtx,
} from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import type { Id, Doc } from '../_generated/dataModel';
import { getPersonWithUser } from '../auth';
import {
  createPostForPerson,
  updatePostForPerson,
  deletePostForPerson,
} from '../posts/mutations';
import {
  createReplyForPerson,
  updateReplyForPerson,
  deleteReplyForPerson,
} from '../replies/mutations';
import { attachmentInputValidator } from '../attachments/model';
const kind = v.union(v.literal('posts'), v.literal('replies'));
async function access(
  ctx: QueryCtx,
  personId: Id<'persons'>,
  eventId: Id<'events'>
) {
  const member = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', personId).eq('eventId', eventId)
    )
    .first();
  if (!member)
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'Event membership required',
    });
}
async function summary(ctx: QueryCtx, row: Doc<'posts'> | Doc<'replies'>) {
  const author = await getPersonWithUser(ctx, row.authorId);
  const attachments = await (
    'eventId' in row
      ? ctx.db
          .query('attachments')
          .withIndex('by_post', q => q.eq('postId', row._id))
      : ctx.db
          .query('attachments')
          .withIndex('by_reply', q => q.eq('replyId', row._id))
  ).collect();
  return {
    id: row._id,
    createdAt: row._creationTime,
    ...('eventId' in row
      ? {
          eventId: row.eventId,
          title: row.title,
          content: row.content,
          editedAt: row.editedAt ?? null,
          replyCount: (
            await ctx.db
              .query('replies')
              .withIndex('by_post', q => q.eq('postId', row._id))
              .collect()
          ).length,
        }
      : {
          postId: row.postId,
          text: row.text,
          updatedAt: row.updatedAt ?? null,
        }),
    author: author
      ? {
          id: author.person._id,
          user: {
            id: author.user._id,
            name: author.user.name ?? null,
            username: author.user.username ?? null,
            image: author.user.image ?? null,
            email: author.user.email ?? null,
          },
        }
      : null,
    attachments: await Promise.all(
      attachments.map(async a => ({
        id: a._id,
        storageId: a.storageId,
        filename: a.filename,
        size: a.size,
        mimeType: a.mimeType,
        url: await ctx.storage.getUrl(a.storageId),
      }))
    ),
  };
}
async function detail(ctx: QueryCtx, row: Doc<'posts'> | Doc<'replies'>) {
  const result = await summary(ctx, row);
  if ('eventId' in row) {
    const replies = await ctx.db
      .query('replies')
      .withIndex('by_post', q => q.eq('postId', row._id))
      .collect();
    return {
      ...result,
      replies: await Promise.all(replies.map(reply => summary(ctx, reply))),
    };
  }
  return result;
}
export const read = internalQuery({
  args: { kind, id: v.string(), personId: v.id('persons') },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId(args.kind, args.id);
    const row = id ? await ctx.db.get(id) : null;
    if (!row)
      throw new ConvexError({
        code: 'NOT_FOUND',
        message: 'Content not found',
      });
    const post = 'eventId' in row ? row : await ctx.db.get(row.postId);
    if (!post)
      throw new ConvexError({ code: 'NOT_FOUND', message: 'Parent not found' });
    await access(ctx, args.personId, post.eventId);
    return detail(ctx, row);
  },
});
export const list = internalQuery({
  args: {
    kind,
    parentId: v.string(),
    personId: v.id('persons'),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const eventId =
      args.kind === 'posts'
        ? ctx.db.normalizeId('events', args.parentId)
        : null;
    const postId =
      args.kind === 'replies'
        ? ctx.db.normalizeId('posts', args.parentId)
        : null;
    const post = postId ? await ctx.db.get(postId) : null;
    if (!eventId && !post)
      throw new ConvexError({ code: 'NOT_FOUND', message: 'Parent not found' });
    await access(ctx, args.personId, eventId ?? post!.eventId);
    const query =
      args.kind === 'posts'
        ? ctx.db
            .query('posts')
            .withIndex('by_event', q => q.eq('eventId', eventId!))
            .order('desc')
        : ctx.db
            .query('replies')
            .withIndex('by_post', q => q.eq('postId', postId!))
            .order('asc');
    if (args.limit === undefined)
      return {
        items: await Promise.all(
          (await query.collect()).map(row => summary(ctx, row))
        ),
        nextCursor: null,
      };
    if (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > 100)
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Limit must be 1–100',
      });
    try {
      const page = await query.paginate({
        numItems: args.limit,
        cursor: args.cursor ?? null,
      });
      return {
        items: await Promise.all(page.page.map(row => summary(ctx, row))),
        nextCursor: page.isDone ? null : page.continueCursor,
      };
    } catch (error) {
      if (error instanceof ConvexError) throw error;
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Invalid content cursor',
      });
    }
  },
});
export const write = internalMutation({
  args: {
    kind,
    operation: v.union(
      v.literal('create'),
      v.literal('edit'),
      v.literal('delete')
    ),
    id: v.string(),
    personId: v.id('persons'),
    body: v.object({
      title: v.optional(v.string()),
      content: v.optional(v.string()),
      text: v.optional(v.string()),
      attachments: v.optional(v.array(attachmentInputValidator)),
      attachmentsToAdd: v.optional(v.array(attachmentInputValidator)),
      attachmentIdsToDelete: v.optional(v.array(v.id('attachments'))),
    }),
  },
  handler: async (ctx, a) => {
    const { personId, body } = a;
    if (a.kind === 'posts') {
      if (a.operation === 'create')
        return createPostForPerson(ctx, personId, {
          eventId: a.id as Id<'events'>,
          title: body.title ?? '',
          content: body.content ?? '',
          attachments: body.attachments,
        });
      if (a.operation === 'delete')
        return deletePostForPerson(ctx, personId, {
          postId: a.id as Id<'posts'>,
        });
      const updated = await updatePostForPerson(ctx, personId, {
        postId: a.id as Id<'posts'>,
        title: body.title,
        content: body.content,
        attachmentsToAdd: body.attachmentsToAdd,
        attachmentIdsToDelete: body.attachmentIdsToDelete,
      });
      return detail(ctx, updated.post!);
    }
    if (a.operation === 'create')
      return createReplyForPerson(ctx, personId, {
        postId: a.id as Id<'posts'>,
        text: body.text ?? '',
        attachments: body.attachments,
      });
    if (a.operation === 'delete')
      return deleteReplyForPerson(ctx, personId, {
        replyId: a.id as Id<'replies'>,
      });
    const updated = await updateReplyForPerson(ctx, personId, {
      replyId: a.id as Id<'replies'>,
      text: body.text,
      attachmentsToAdd: body.attachmentsToAdd,
      attachmentIdsToDelete: body.attachmentIdsToDelete,
    });
    return summary(ctx, updated.reply!);
  },
});
