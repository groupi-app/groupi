import { query } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { requireAuth } from '../auth';
import { tool } from '../groupTools/contracts';
import {
  contentCapabilities,
  requireContentAccess,
} from '../groupTools/context';
import { publicPage } from '../lib/pagination';
import type { QueryCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
const page = v.object({
  page: v.array(tool),
  isDone: v.boolean(),
  continueCursor: v.string(),
});
const listArgs = {
  eventId: v.id('events'),
  paginationOpts: paginationOptsValidator,
};
async function list(
  ctx: QueryCtx,
  args: {
    eventId: Id<'events'>;
    paginationOpts: { numItems: number; cursor: string | null };
  },
  kind: 'FORM' | 'LIST' | 'POLL'
) {
  const { person } = await requireAuth(ctx);
  await requireContentAccess(ctx, person._id, args);
  const opts = args.paginationOpts;
  if (
    !Number.isInteger(opts.numItems) ||
    opts.numItems < 1 ||
    opts.numItems > 100 ||
    (opts.cursor !== null && (!opts.cursor || opts.cursor.length > 4096))
  )
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid content page size or cursor.',
    });
  return publicPage(
    await ctx.db
      .query('groupTools')
      .withIndex('by_eventId_and_kind', q =>
        q.eq('eventId', args.eventId).eq('kind', kind)
      )
      .order('desc')
      .paginate(opts)
  );
}
export const listForms = query({
  args: listArgs,
  returns: page,
  handler: (ctx, args) => list(ctx, args, 'FORM'),
});
export const listLists = query({
  args: listArgs,
  returns: page,
  handler: (ctx, args) => list(ctx, args, 'LIST'),
});
export const listPolls = query({
  args: listArgs,
  returns: page,
  handler: (ctx, args) => list(ctx, args, 'POLL'),
});
export const getContext = query({
  args: { eventId: v.id('events') },
  returns: v.object({
    title: v.string(),
    canCreate: v.boolean(),
    canManage: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    const capabilities = await contentCapabilities(ctx, person._id, args);
    const event = await ctx.db.get(args.eventId);
    if (!event)
      throw new ConvexError({ code: 'NOT_FOUND', message: 'Event not found.' });
    return { title: event.title, ...capabilities };
  },
});
