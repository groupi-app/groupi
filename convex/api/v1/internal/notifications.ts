import { groupNotificationReferences } from '../../../groupInvites/notificationProjection';
import {
  readNotification,
  unreadNotification,
  readAllNotifications,
  readEventNotifications,
  readPostNotifications,
  clearNotification,
  clearAllNotifications,
} from '../../../notifications/model';
import {
  internalQuery,
  internalMutation,
  type QueryCtx,
} from '../../../_generated/server';
import { v } from 'convex/values';
import { Id, Doc } from '../../../_generated/dataModel';
import { authComponent, AuthUserId } from '../../../auth';

const reference = v.union(
  v.object({ id: v.string(), title: v.string() }),
  v.null()
);
const notificationSummary = v.object({
  id: v.string(),
  personId: v.string(),
  type: v.string(),
  read: v.boolean(),
  createdAt: v.number(),
  group: v.optional(reference),
  groupInvite: v.optional(
    v.union(v.object({ id: v.string(), status: v.string() }), v.null())
  ),
  event: reference,
  post: reference,
  author: v.union(
    v.null(),
    v.object({
      id: v.string(),
      userId: v.string(),
      user: v.object({
        name: v.union(v.string(), v.null()),
        email: v.union(v.string(), v.null()),
      }),
    })
  ),
});

/**
 * Internal queries and mutations for notification routes
 */

export const listNotifications = internalQuery({
  args: {
    personId: v.string(),
    unreadOnly: v.optional(v.boolean()),
  },
  returns: v.array(notificationSummary),
  handler: async (ctx, { personId, unreadOnly }) => {
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_person', q => q.eq('personId', personId as Id<'persons'>))
      .order('desc')
      .collect();

    const filtered = unreadOnly
      ? notifications.filter(n => !n.read)
      : notifications;

    // Enrich notifications with related data
    const enriched = await Promise.all(
      filtered.map(async notification => {
        return enrichNotification(ctx, notification);
      })
    );

    return enriched;
  },
});

export const getUnreadCount = internalQuery({
  args: {
    personId: v.string(),
  },
  returns: v.object({ count: v.number() }),
  handler: async (ctx, { personId }) => {
    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_person_read', q =>
        q.eq('personId', personId as Id<'persons'>).eq('read', false)
      )
      .collect();

    return { count: unread.length };
  },
});

export const markAsRead = internalMutation({
  args: {
    notificationId: v.string(),
    personId: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { notificationId, personId }) => {
    return readNotification(
      ctx,
      personId as Id<'persons'>,
      notificationId as Id<'notifications'>
    );
  },
});

export const markAsUnread = internalMutation({
  args: {
    notificationId: v.string(),
    personId: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { notificationId, personId }) => {
    return unreadNotification(
      ctx,
      personId as Id<'persons'>,
      notificationId as Id<'notifications'>
    );
  },
});

export const markAllAsRead = internalMutation({
  args: {
    personId: v.string(),
  },
  returns: v.object({ success: v.boolean(), count: v.number() }),
  handler: async (ctx, { personId }) => {
    return readAllNotifications(ctx, personId as Id<'persons'>);
  },
});

export const deleteNotification = internalMutation({
  args: {
    notificationId: v.string(),
    personId: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { notificationId, personId }) => {
    return clearNotification(
      ctx,
      personId as Id<'persons'>,
      notificationId as Id<'notifications'>
    );
  },
});

export const deleteAllNotifications = internalMutation({
  args: {
    personId: v.string(),
  },
  returns: v.object({ success: v.boolean(), count: v.number() }),
  handler: async (ctx, { personId }) => {
    return clearAllNotifications(ctx, personId as Id<'persons'>);
  },
});

async function enrichNotification(
  ctx: QueryCtx,
  notification: Doc<'notifications'>
) {
  // Get event if exists
  let event = null;
  if (notification.eventId) {
    const eventDoc = await ctx.db.get(notification.eventId);
    if (eventDoc) {
      event = { id: eventDoc._id, title: eventDoc.title };
    }
  }

  // Get post if exists
  let post = null;
  if (notification.postId) {
    const postDoc = await ctx.db.get(notification.postId);
    if (postDoc) {
      post = { id: postDoc._id, title: postDoc.title };
    }
  }

  // Get author if exists
  let author = null;
  if (notification.authorId) {
    const authorPerson = await ctx.db.get(notification.authorId);
    if (authorPerson) {
      const authorUser = await authComponent.getAnyUserById(
        ctx,
        authorPerson.userId as AuthUserId
      );
      author = {
        id: authorPerson._id,
        userId: authorPerson.userId,
        user: authorUser
          ? {
              name: authorUser.name || null,
              email: notification.groupId ? null : authorUser.email,
            }
          : {
              name: null,
              email: null,
            },
      };
    }
  }

  return {
    ...(await groupNotificationReferences(ctx, notification)),
    id: notification._id,
    personId: notification.personId,
    type: notification.type,
    read: notification.read,
    createdAt: notification._creationTime,
    event,
    post,
    author,
  };
}

/** Historical own notifications retain their references, including pending invitations. */
export const listNotificationsPage = internalQuery({
  args: {
    personId: v.id('persons'),
    unreadOnly: v.boolean(),
    limit: v.number(),
    cursor: v.union(v.string(), v.null()),
  },
  returns: v.union(
    v.object({
      items: v.array(notificationSummary),
      nextCursor: v.union(v.string(), v.null()),
    }),
    v.object({ error: v.literal('INVALID_CURSOR') })
  ),
  handler: async (ctx, { personId, unreadOnly, limit, cursor }) => {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      throw Error('Invalid page size');
    let nativeCursor: string | null = null;
    if (cursor !== null) {
      try {
        const parsed = JSON.parse(atob(cursor));
        if (
          parsed?.personId !== personId ||
          parsed?.unreadOnly !== unreadOnly ||
          typeof parsed?.cursor !== 'string' ||
          parsed?.kind !== 'notifications'
        )
          return { error: 'INVALID_CURSOR' as const };
        nativeCursor = parsed.cursor;
      } catch {
        return { error: 'INVALID_CURSOR' as const };
      }
    }
    const query = unreadOnly
      ? ctx.db
          .query('notifications')
          .withIndex('by_person_read', q =>
            q.eq('personId', personId).eq('read', false)
          )
      : ctx.db
          .query('notifications')
          .withIndex('by_person', q => q.eq('personId', personId));
    let page;
    try {
      page = await query
        .order('desc')
        .paginate({ cursor: nativeCursor, numItems: limit });
    } catch (error) {
      if (nativeCursor !== null) return { error: 'INVALID_CURSOR' as const };
      throw error;
    }
    return {
      items: await Promise.all(page.page.map(n => enrichNotification(ctx, n))),
      nextCursor: page.isDone
        ? null
        : btoa(
            JSON.stringify({
              kind: 'notifications',
              personId,
              unreadOnly,
              cursor: page.continueCursor,
            })
          ),
    };
  },
});

export const markScopeAsRead = internalMutation({
  args: {
    personId: v.id('persons'),
    eventId: v.optional(v.id('events')),
    postId: v.optional(v.id('posts')),
  },
  returns: v.object({ success: v.boolean(), count: v.number() }),
  handler: async (ctx, { personId, eventId, postId }) => {
    if (eventId && !postId)
      return readEventNotifications(ctx, personId, eventId);
    if (postId && !eventId) return readPostNotifications(ctx, personId, postId);
    throw Error('Supply exactly one scope');
  },
});
