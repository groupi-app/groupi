import { deleteResolvedAccount } from '../users/mutations';
import {
  internalQuery,
  internalMutation,
  type MutationCtx,
} from '../_generated/server';
import { ConvexError, v } from 'convex/values';
import { components } from '../_generated/api';
import { authComponent, type AuthUserId, type ExtendedAuthUser } from '../auth';
import { isAdminRole } from '../lib/constants';

/**
 * Internal queries and mutations for admin routes
 */

async function requireAdminActor(ctx: MutationCtx, actorUserId: string) {
  const user = await authComponent.getAnyUserById(
    ctx,
    actorUserId as AuthUserId
  );
  if (!isAdminRole((user as ExtendedAuthUser | null)?.role)) {
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'Admin privileges required',
    });
  }
}

export const isAdmin = internalQuery({
  args: {
    userId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, { userId }) => {
    const user = await authComponent.getAnyUserById(ctx, userId as AuthUserId);
    if (!user) return false;

    const extendedUser = user as { role?: string | null };
    return isAdminRole(extendedUser.role);
  },
});

export const listUsers = internalQuery({
  args: {},
  returns: v.object({
    users: v.array(
      v.object({
        userId: v.string(),
        user: v.object({
          id: v.string(),
          name: v.union(v.string(), v.null()),
          email: v.union(v.string(), v.null()),
          image: v.union(v.string(), v.null()),
          username: v.union(v.string(), v.null()),
        }),
        person: v.object({
          id: v.id('persons'),
          bio: v.union(v.string(), v.null()),
          pronouns: v.union(v.string(), v.null()),
        }),
        createdAt: v.number(),
      })
    ),
  }),
  handler: async ctx => {
    const persons = await ctx.db.query('persons').order('desc').collect();

    const users = await Promise.all(
      persons.map(async person => {
        const user = await authComponent.getAnyUserById(
          ctx,
          person.userId as AuthUserId
        );

        const extendedUser = user as {
          _id?: string;
          name?: string | null;
          email?: string | null;
          image?: string | null;
          username?: string | null;
        } | null;

        return {
          userId: person.userId,
          user: extendedUser
            ? {
                id: extendedUser._id ?? person.userId,
                name: extendedUser.name ?? null,
                email: extendedUser.email ?? null,
                image: extendedUser.image ?? null,
                username: extendedUser.username ?? null,
              }
            : {
                id: person.userId,
                name: null,
                email: null,
                image: null,
                username: null,
              },
          person: {
            id: person._id,
            bio: person.bio ?? null,
            pronouns: person.pronouns ?? null,
          },
          createdAt: person._creationTime,
        };
      })
    );

    return { users };
  },
});

export const deleteUser = internalMutation({
  args: {
    actorUserId: v.string(),
    userId: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { actorUserId, userId }) => {
    await requireAdminActor(ctx, actorUserId);
    // Find person record
    const person = await ctx.db
      .query('persons')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .first();

    if (!person) {
      throw new Error('User not found');
    }

    const user = await authComponent.getAnyUserById(
      ctx,
      person.userId as AuthUserId
    );
    await deleteResolvedAccount(ctx, person, user);

    return { success: true };
  },
});

export const setUserRole = internalMutation({
  args: {
    actorUserId: v.string(),
    userId: v.string(),
    role: v.union(v.literal('user'), v.literal('admin')),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { actorUserId, userId, role }) => {
    await requireAdminActor(ctx, actorUserId);
    // Update the role via Better Auth component adapter
    const result = await ctx.runMutation(
      components.betterAuth.adapter.updateOne,
      {
        input: {
          model: 'user',
          where: [{ field: '_id', operator: 'eq', value: userId }],
          update: { role, updatedAt: Date.now() },
        },
      }
    );

    if (!result) {
      throw new Error('User not found');
    }

    return { success: true };
  },
});

export const listAllEvents = internalQuery({
  args: {},
  returns: v.object({
    events: v.array(
      v.object({
        id: v.id('events'),
        title: v.string(),
        description: v.union(v.string(), v.null()),
        location: v.union(v.string(), v.null()),
        creatorId: v.id('persons'),
        memberCount: v.number(),
        chosenDateTime: v.union(v.number(), v.null()),
        createdAt: v.number(),
        updatedAt: v.number(),
      })
    ),
  }),
  handler: async ctx => {
    const events = await ctx.db.query('events').order('desc').collect();

    return {
      events: events.map(event => ({
        id: event._id,
        title: event.title,
        description: event.description ?? null,
        location: event.location ?? null,
        creatorId: event.creatorId,
        memberCount: event.memberCount ?? 0,
        chosenDateTime: event.chosenDateTime ?? null,
        createdAt: event._creationTime,
        updatedAt: event.updatedAt,
      })),
    };
  },
});

export const listReportsAdmin = internalQuery({
  args: {},
  returns: v.object({
    reports: v.array(
      v.object({
        id: v.id('reports'),
        reporterId: v.id('persons'),
        targetType: v.union(
          v.literal('USER'),
          v.literal('EVENT'),
          v.literal('POST'),
          v.literal('REPLY')
        ),
        targetId: v.string(),
        reason: v.union(
          v.literal('SPAM'),
          v.literal('HARASSMENT'),
          v.literal('HATE_SPEECH'),
          v.literal('INAPPROPRIATE_CONTENT'),
          v.literal('IMPERSONATION'),
          v.literal('OTHER')
        ),
        details: v.union(v.string(), v.null()),
        status: v.union(
          v.literal('PENDING'),
          v.literal('DISMISSED'),
          v.literal('ACTION_TAKEN')
        ),
        createdAt: v.number(),
      })
    ),
  }),
  handler: async ctx => {
    const reports = await ctx.db.query('reports').order('desc').collect();

    return {
      reports: reports.map(report => ({
        id: report._id,
        reporterId: report.reporterId,
        targetType: report.targetType,
        targetId: report.targetId,
        reason: report.reason,
        details: report.details ?? null,
        status: report.status,
        createdAt: report.createdAt,
      })),
    };
  },
});
