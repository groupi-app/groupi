import { query, QueryCtx } from '../_generated/server';
import { v } from 'convex/values';
import {
  getCurrentPerson,
  isAdmin,
  authComponent,
  ExtendedAuthUser,
  AuthUserId,
} from '../auth';

/**
 * Admin queries for the Convex backend
 *
 * These functions provide admin-level data access for managing the platform.
 * All functions require admin privileges.
 */

/**
 * Check if current user has admin privileges
 */
async function requireAdmin(ctx: QueryCtx) {
  const currentPerson = await getCurrentPerson(ctx);
  if (!currentPerson) {
    throw new Error('Authentication required');
  }

  // Check admin status via auth utility
  const admin = await isAdmin(ctx);
  if (!admin) {
    throw new Error('Admin privileges required');
  }

  return currentPerson;
}

/**
 * User info type for admin queries
 */
type UserInfo = {
  name: string | null;
  email: string;
  image?: string | null;
  username?: string | null;
  role?: string | null;
} | null;

/**
 * Helper to get user info using Better Auth component's getAnyUserById
 */
async function getUserInfo(ctx: QueryCtx, userId: string): Promise<UserInfo> {
  try {
    // Use Better Auth component to look up any user by ID
    const user = await authComponent.getAnyUserById(ctx, userId as AuthUserId);
    if (!user) return null;

    const extendedUser = user as ExtendedAuthUser;
    return {
      name: extendedUser.name || null,
      email: extendedUser.email,
      image: extendedUser.image || null,
      username: extendedUser.username || null,
      role: extendedUser.role || null,
    };
  } catch {
    // Return null if user lookup fails
    return null;
  }
}

/**
 * Get paginated list of all events for admin
 */
export const getEventsAdmin = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { cursor, limit = 100, search }) => {
    // Require admin privileges
    await requireAdmin(ctx);

    let eventsQuery = ctx.db.query('events');

    // Apply search filter if provided
    if (search && search.trim()) {
      const allEvents = await eventsQuery.collect();
      const filteredEvents = allEvents.filter(
        event =>
          event.title.toLowerCase().includes(search.toLowerCase()) ||
          (event.description &&
            event.description.toLowerCase().includes(search.toLowerCase())) ||
          (event.location &&
            event.location.toLowerCase().includes(search.toLowerCase()))
      );

      const startIndex = cursor ? parseInt(cursor) : 0;
      const events = filteredEvents.slice(startIndex, startIndex + limit);
      const hasMore = startIndex + limit < filteredEvents.length;
      const nextCursor = hasMore ? (startIndex + limit).toString() : undefined;

      // Get creator info for each event
      const eventsWithCreator = await Promise.all(
        events.map(async event => {
          const creator = await ctx.db.get(event.creatorId);
          const creatorUser = creator
            ? await getUserInfo(ctx, creator.userId)
            : null;

          // Get member and post counts
          const memberCount = await ctx.db
            .query('memberships')
            .withIndex('by_event', q => q.eq('eventId', event._id))
            .collect()
            .then(memberships => memberships.length);

          const postCount = await ctx.db
            .query('posts')
            .withIndex('by_event', q => q.eq('eventId', event._id))
            .collect()
            .then(posts => posts.length);

          return {
            id: event._id,
            title: event.title,
            description: event.description || '',
            location: event.location || '',
            creatorId: event.creatorId,
            createdAt: event._creationTime,
            organizer: creatorUser
              ? {
                  name: creatorUser.name || null,
                  email: creatorUser.email,
                }
              : null,
            _count: {
              memberships: memberCount,
              posts: postCount,
            },
          };
        })
      );

      return {
        events: eventsWithCreator,
        totalCount: filteredEvents.length,
        nextCursor,
        hasMore,
      };
    }

    // No search - use simple offset pagination
    const allEvents = await eventsQuery.collect();
    const startIndex = cursor ? parseInt(cursor) : 0;
    const events = allEvents.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < allEvents.length;
    const nextCursor = hasMore ? (startIndex + limit).toString() : undefined;

    // Get creator info and counts for each event
    const eventsWithCreator = await Promise.all(
      events.map(async event => {
        const creator = await ctx.db.get(event.creatorId);
        const creatorUser = creator
          ? await getUserInfo(ctx, creator.userId)
          : null;

        // Get member and post counts
        const memberCount = await ctx.db
          .query('memberships')
          .withIndex('by_event', q => q.eq('eventId', event._id))
          .collect()
          .then(memberships => memberships.length);

        const postCount = await ctx.db
          .query('posts')
          .withIndex('by_event', q => q.eq('eventId', event._id))
          .collect()
          .then(posts => posts.length);

        return {
          id: event._id,
          title: event.title,
          description: event.description || '',
          location: event.location || '',
          creatorId: event.creatorId,
          createdAt: event._creationTime,
          organizer: creatorUser
            ? {
                name: creatorUser.name || null,
                email: creatorUser.email,
              }
            : null,
          _count: {
            memberships: memberCount,
            posts: postCount,
          },
        };
      })
    );

    return {
      events: eventsWithCreator,
      totalCount: allEvents.length,
      nextCursor,
      hasMore,
    };
  },
});

/**
 * Get paginated list of all posts for admin
 */
export const getPostsAdmin = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { cursor, limit = 100, search }) => {
    // Require admin privileges
    await requireAdmin(ctx);

    let postsQuery = ctx.db.query('posts');

    // Apply search filter if provided
    if (search && search.trim()) {
      const allPosts = await postsQuery.collect();
      const filteredPosts = allPosts.filter(
        post =>
          post.title.toLowerCase().includes(search.toLowerCase()) ||
          post.content.toLowerCase().includes(search.toLowerCase())
      );

      const startIndex = cursor ? parseInt(cursor) : 0;
      const posts = filteredPosts.slice(startIndex, startIndex + limit);
      const hasMore = startIndex + limit < filteredPosts.length;
      const nextCursor = hasMore ? (startIndex + limit).toString() : undefined;

      const postsWithDetails = await Promise.all(
        posts.map(async post => {
          const author = await ctx.db.get(post.authorId);
          const authorUser = author
            ? await getUserInfo(ctx, author.userId)
            : null;
          const event = await ctx.db.get(post.eventId);

          const replyCount = await ctx.db
            .query('replies')
            .withIndex('by_post', q => q.eq('postId', post._id))
            .collect()
            .then(replies => replies.length);

          return {
            id: post._id,
            title: post.title,
            content: post.content,
            authorId: post.authorId,
            eventId: post.eventId,
            createdAt: post._creationTime,
            author: authorUser
              ? {
                  name: authorUser.name || null,
                  email: authorUser.email,
                }
              : null,
            event: event
              ? {
                  title: event.title,
                }
              : null,
            _count: {
              replies: replyCount,
            },
          };
        })
      );

      return {
        posts: postsWithDetails,
        totalCount: filteredPosts.length,
        nextCursor,
        hasMore,
      };
    }

    // No search - use simple offset pagination
    const allPosts = await postsQuery.collect();
    const startIndex = cursor ? parseInt(cursor) : 0;
    const posts = allPosts.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < allPosts.length;
    const nextCursor = hasMore ? (startIndex + limit).toString() : undefined;

    const postsWithDetails = await Promise.all(
      posts.map(async post => {
        const author = await ctx.db.get(post.authorId);
        const authorUser = author
          ? await getUserInfo(ctx, author.userId)
          : null;
        const event = await ctx.db.get(post.eventId);

        const replyCount = await ctx.db
          .query('replies')
          .withIndex('by_post', q => q.eq('postId', post._id))
          .collect()
          .then(replies => replies.length);

        return {
          id: post._id,
          title: post.title,
          content: post.content,
          authorId: post.authorId,
          eventId: post.eventId,
          createdAt: post._creationTime,
          author: authorUser
            ? {
                name: authorUser.name || null,
                email: authorUser.email,
              }
            : null,
          event: event
            ? {
                title: event.title,
              }
            : null,
          _count: {
            replies: replyCount,
          },
        };
      })
    );

    return {
      posts: postsWithDetails,
      totalCount: allPosts.length,
      nextCursor,
      hasMore,
    };
  },
});

/**
 * Get paginated list of all replies for admin
 */
export const getRepliesAdmin = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { cursor, limit = 100, search }) => {
    // Require admin privileges
    await requireAdmin(ctx);

    let repliesQuery = ctx.db.query('replies');

    // Apply search filter if provided
    if (search && search.trim()) {
      const allReplies = await repliesQuery.collect();
      const filteredReplies = allReplies.filter(reply =>
        reply.text.toLowerCase().includes(search.toLowerCase())
      );

      const startIndex = cursor ? parseInt(cursor) : 0;
      const replies = filteredReplies.slice(startIndex, startIndex + limit);
      const hasMore = startIndex + limit < filteredReplies.length;
      const nextCursor = hasMore ? (startIndex + limit).toString() : undefined;

      const repliesWithDetails = await Promise.all(
        replies.map(async reply => {
          const author = await ctx.db.get(reply.authorId);
          const authorUser = author
            ? await getUserInfo(ctx, author.userId)
            : null;
          const post = await ctx.db.get(reply.postId);
          const event = post ? await ctx.db.get(post.eventId) : null;

          return {
            id: reply._id,
            content: reply.text,
            text: reply.text,
            authorId: reply.authorId,
            postId: reply.postId,
            createdAt: reply._creationTime,
            author: authorUser
              ? {
                  name: authorUser.name || null,
                  email: authorUser.email,
                }
              : null,
            post: post
              ? {
                  title: post.title,
                  event: event
                    ? {
                        title: event.title,
                      }
                    : null,
                }
              : null,
          };
        })
      );

      return {
        replies: repliesWithDetails,
        totalCount: filteredReplies.length,
        nextCursor,
        hasMore,
      };
    }

    // No search - use simple offset pagination
    const allReplies = await repliesQuery.collect();
    const startIndex = cursor ? parseInt(cursor) : 0;
    const replies = allReplies.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < allReplies.length;
    const nextCursor = hasMore ? (startIndex + limit).toString() : undefined;

    const repliesWithDetails = await Promise.all(
      replies.map(async reply => {
        const author = await ctx.db.get(reply.authorId);
        const authorUser = author
          ? await getUserInfo(ctx, author.userId)
          : null;
        const post = await ctx.db.get(reply.postId);
        const event = post ? await ctx.db.get(post.eventId) : null;

        return {
          id: reply._id,
          content: reply.text,
          text: reply.text,
          authorId: reply.authorId,
          postId: reply.postId,
          createdAt: reply._creationTime,
          author: authorUser
            ? {
                name: authorUser.name || null,
                email: authorUser.email,
              }
            : null,
          post: post
            ? {
                title: post.title,
                event: event
                  ? {
                      title: event.title,
                    }
                  : null,
              }
            : null,
        };
      })
    );

    return {
      replies: repliesWithDetails,
      totalCount: allReplies.length,
      nextCursor,
      hasMore,
    };
  },
});

/**
 * Get paginated list of all users for admin
 * Note: Users are stored in Better Auth component, persons are in our schema
 */
export const getUsersAdmin = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { cursor, limit = 100, search }) => {
    // Require admin privileges
    await requireAdmin(ctx);

    // Get all persons (our app's user records)
    const allPersons = await ctx.db.query('persons').collect();

    // Get user info for each person from Better Auth
    const personsWithUsers = await Promise.all(
      allPersons.map(async person => {
        const user = await getUserInfo(ctx, person.userId);
        return { person, user };
      })
    );

    // Filter out persons without valid users
    let validPersonsWithUsers = personsWithUsers.filter(
      ({ user }) => user !== null
    );

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      validPersonsWithUsers = validPersonsWithUsers.filter(
        ({ user }) =>
          (user?.name && user.name.toLowerCase().includes(searchLower)) ||
          (user?.email && user.email.toLowerCase().includes(searchLower)) ||
          (user?.username && user.username.toLowerCase().includes(searchLower))
      );
    }

    const startIndex = cursor ? parseInt(cursor) : 0;
    const pageItems = validPersonsWithUsers.slice(
      startIndex,
      startIndex + limit
    );
    const hasMore = startIndex + limit < validPersonsWithUsers.length;
    const nextCursor = hasMore ? (startIndex + limit).toString() : undefined;

    const usersWithDetails = await Promise.all(
      pageItems.map(async ({ person, user }) => {
        const membershipCount = await ctx.db
          .query('memberships')
          .withIndex('by_person', q => q.eq('personId', person._id))
          .collect()
          .then(memberships => memberships.length);

        return {
          id: person.userId,
          personId: person._id,
          name: user?.name || null,
          email: user?.email || 'unknown',
          username: user?.username || null,
          image: user?.image || null,
          role: user?.role || 'user',
          createdAt: person._creationTime,
          _count: {
            memberships: membershipCount,
          },
        };
      })
    );

    return {
      users: usersWithDetails,
      totalCount: validPersonsWithUsers.length,
      nextCursor,
      hasMore,
    };
  },
});
