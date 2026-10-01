import { internalMutation, internalQuery } from '../../../_generated/server';
import { v, ConvexError } from 'convex/values';
import { authComponent, type AuthUserId } from '../../../auth';
import { blockUserForPerson, unblockUserForPerson } from '../../../lib/friends';

const kind = v.union(
  v.literal('friends'),
  v.literal('incoming'),
  v.literal('outgoing'),
  v.literal('blocks')
);
export const listPage = internalQuery({
  args: {
    personId: v.id('persons'),
    kind,
    limit: v.number(),
    cursor: v.union(v.string(), v.null()),
  },
  returns: v.object({
    items: v.array(
      v.object({
        personId: v.id('persons'),
        userId: v.string(),
        name: v.union(v.string(), v.null()),
        username: v.union(v.string(), v.null()),
        image: v.union(v.string(), v.null()),
        friendshipId: v.optional(v.id('friendships')),
        lastSeen: v.optional(v.union(v.number(), v.null())),
        createdAt: v.optional(v.number()),
        blockedAt: v.optional(v.number()),
      })
    ),
    nextCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    if (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > 100)
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Limit must be from 1 to 100.',
      });
    let phase = 0;
    let cursor: string | null = null;
    if (args.cursor) {
      try {
        const decoded = JSON.parse(atob(args.cursor));
        if (
          decoded.personId !== args.personId ||
          decoded.kind !== args.kind ||
          !(args.kind === 'friends' ? [0, 1] : [0]).includes(decoded.phase) ||
          (decoded.cursor !== null && typeof decoded.cursor !== 'string')
        )
          throw new Error();
        phase = decoded.phase;
        cursor = decoded.cursor;
      } catch {
        throw new ConvexError({
          code: 'VALIDATION_ERROR',
          message: 'Invalid social cursor. Start again without a cursor.',
        });
      }
    }
    const page = await (async () => {
      try {
        if (args.kind === 'blocks')
          return await ctx.db
            .query('userBlocks')
            .withIndex('by_blocker', q => q.eq('blockerId', args.personId))
            .paginate({ numItems: args.limit, cursor });
        const status = args.kind === 'friends' ? 'ACCEPTED' : 'PENDING';
        return await (
          args.kind === 'incoming' || (args.kind === 'friends' && phase === 1)
            ? ctx.db
                .query('friendships')
                .withIndex('by_addressee_status', q =>
                  q.eq('addresseeId', args.personId).eq('status', status)
                )
            : ctx.db
                .query('friendships')
                .withIndex('by_requester_status', q =>
                  q.eq('requesterId', args.personId).eq('status', status)
                )
        ).paginate({ numItems: args.limit, cursor });
      } catch {
        throw new ConvexError({
          code: 'VALIDATION_ERROR',
          message: 'Invalid social cursor. Start again without a cursor.',
        });
      }
    })();
    const items = (
      await Promise.all(
        page.page.map(async row => {
          const personId =
            'blockedId' in row
              ? row.blockedId
              : row.requesterId === args.personId
                ? row.addresseeId
                : row.requesterId;
          const person = await ctx.db.get(personId);
          if (!person) return null;
          const user = await authComponent.getAnyUserById(
            ctx,
            person.userId as AuthUserId
          );
          if (!user) return null;
          const summary = {
            personId,
            userId: person.userId,
            name: user.name ?? null,
            username: user.username ?? null,
            image: user.image ?? null,
          };
          if ('blockedId' in row)
            return { ...summary, blockedAt: row.createdAt };
          return {
            ...summary,
            friendshipId: row._id,
            ...(args.kind === 'friends'
              ? { lastSeen: person.lastSeen ?? null }
              : { createdAt: row.createdAt }),
          };
        })
      )
    ).filter(item => item !== null);
    const nextCursor = !page.isDone
      ? btoa(
          JSON.stringify({
            personId: args.personId,
            kind: args.kind,
            phase,
            cursor: page.continueCursor,
          })
        )
      : args.kind === 'friends' && phase === 0
        ? btoa(
            JSON.stringify({
              personId: args.personId,
              kind: args.kind,
              phase: 1,
              cursor: null,
            })
          )
        : null;
    return { items, nextCursor };
  },
});
export const blockStatus = internalQuery({
  args: { personId: v.id('persons'), targetPersonId: v.string() },
  returns: v.object({ blockedByMe: v.boolean(), blockedByThem: v.boolean() }),
  handler: async (ctx, { personId, targetPersonId: targetId }) => {
    const targetPersonId = ctx.db.normalizeId('persons', targetId);
    if (!targetPersonId)
      throw new ConvexError({ code: 'NOT_FOUND', message: 'User not found' });
    const [mine, theirs] = await Promise.all([
      ctx.db
        .query('userBlocks')
        .withIndex('by_blocker_blocked', q =>
          q.eq('blockerId', personId).eq('blockedId', targetPersonId)
        )
        .first(),
      ctx.db
        .query('userBlocks')
        .withIndex('by_blocker_blocked', q =>
          q.eq('blockerId', targetPersonId).eq('blockedId', personId)
        )
        .first(),
    ]);
    return { blockedByMe: !!mine, blockedByThem: !!theirs };
  },
});
export const changeBlock = internalMutation({
  args: {
    personId: v.id('persons'),
    targetPersonId: v.string(),
    blocked: v.boolean(),
  },
  returns: v.object({ success: v.boolean(), message: v.string() }),
  handler: async (ctx, { personId, targetPersonId: targetId, blocked }) => {
    const targetPersonId = ctx.db.normalizeId('persons', targetId);
    if (!targetPersonId)
      throw new ConvexError({ code: 'NOT_FOUND', message: 'User not found' });
    try {
      return await (blocked ? blockUserForPerson : unblockUserForPerson)(
        ctx,
        { _id: personId },
        { personId: targetPersonId }
      );
    } catch (error) {
      if (!(error instanceof ConvexError)) throw error;
      const message = String(error.data);
      throw new ConvexError({
        code: message.includes('not found') ? 'NOT_FOUND' : 'VALIDATION_ERROR',
        message,
      });
    }
  },
});
