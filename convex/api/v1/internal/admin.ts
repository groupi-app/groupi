import { deleteResolvedAccount } from '../../../users/mutations';
import { internalQuery, internalMutation } from '../../../_generated/server';
import { v } from 'convex/values';
import { components } from '../../../_generated/api';
import { authComponent, type AuthUserId } from '../../../auth';
import { isAdminRole } from '../../../lib/constants';

/**
 * Internal queries and mutations for admin routes
 */

export const isAdmin = internalQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const user = await authComponent.getAnyUserById(ctx, userId as AuthUserId);
    if (!user) return false;

    const extendedUser = user as { role?: string | null };
    return isAdminRole(extendedUser.role);
  },
});

export const listUsers = internalQuery({
  args: {},
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
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
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
    userId: v.string(),
    role: v.union(v.literal('user'), v.literal('admin')),
  },
  handler: async (ctx, { userId, role }) => {
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
