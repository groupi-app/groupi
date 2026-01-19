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
 * Admin Explorer Queries
 *
 * These queries provide detailed entity views with relation expansion
 * for the admin Data Explorer feature.
 */

/**
 * Check if current user has admin privileges
 */
async function requireAdmin(ctx: QueryCtx) {
  const currentPerson = await getCurrentPerson(ctx);
  if (!currentPerson) {
    throw new Error('Authentication required');
  }

  const admin = await isAdmin(ctx);
  if (!admin) {
    throw new Error('Admin privileges required');
  }

  return currentPerson;
}

/**
 * Helper to get user info using Better Auth component
 */
async function getUserInfo(ctx: QueryCtx, userId: string) {
  try {
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
    return null;
  }
}

/**
 * Get a user with all their relations expanded
 */
export const getUserWithRelations = query({
  args: {
    personId: v.id('persons'),
  },
  handler: async (ctx, { personId }) => {
    await requireAdmin(ctx);

    const person = await ctx.db.get(personId);
    if (!person) return null;

    const user = await getUserInfo(ctx, person.userId);
    if (!user) return null;

    // Get all counts in parallel
    const [memberships, posts, replies, notifications] = await Promise.all([
      ctx.db
        .query('memberships')
        .withIndex('by_person', q => q.eq('personId', personId))
        .collect(),
      ctx.db
        .query('posts')
        .withIndex('by_author', q => q.eq('authorId', personId))
        .collect(),
      ctx.db
        .query('replies')
        .withIndex('by_author', q => q.eq('authorId', personId))
        .collect(),
      ctx.db
        .query('notifications')
        .withIndex('by_person', q => q.eq('personId', personId))
        .collect(),
    ]);

    // Get events created by this user
    const eventsCreated = await ctx.db
      .query('events')
      .withIndex('by_creator', q => q.eq('creatorId', personId))
      .collect();

    return {
      id: person.userId,
      personId: person._id,
      name: user.name,
      email: user.email,
      username: user.username,
      image: user.image,
      role: user.role || 'user',
      bio: person.bio || null,
      pronouns: person.pronouns || null,
      lastSeen: person.lastSeen || null,
      createdAt: person._creationTime,
      _count: {
        memberships: memberships.length,
        posts: posts.length,
        replies: replies.length,
        notifications: notifications.length,
        eventsCreated: eventsCreated.length,
      },
    };
  },
});

/**
 * Get a user's memberships with event details
 */
export const getUserMemberships = query({
  args: {
    personId: v.id('persons'),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { personId, cursor, limit = 50 }) => {
    await requireAdmin(ctx);

    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_person', q => q.eq('personId', personId))
      .collect();

    const startIndex = cursor ? parseInt(cursor) : 0;
    const page = memberships.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < memberships.length;
    const nextCursor = hasMore ? (startIndex + limit).toString() : undefined;

    const membershipsWithDetails = await Promise.all(
      page.map(async membership => {
        const event = await ctx.db.get(membership.eventId);
        return {
          id: membership._id,
          role: membership.role,
          rsvpStatus: membership.rsvpStatus,
          personId: membership.personId,
          eventId: membership.eventId,
          event: event
            ? {
                id: event._id,
                title: event.title,
                location: event.location || null,
                chosenDateTime: event.chosenDateTime || null,
              }
            : null,
        };
      })
    );

    return {
      memberships: membershipsWithDetails,
      totalCount: memberships.length,
      nextCursor,
      hasMore,
    };
  },
});

/**
 * Get all memberships with full enrichment (for the memberships tab)
 */
export const getMembershipsAdmin = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    eventId: v.optional(v.id('events')),
    personId: v.optional(v.id('persons')),
  },
  handler: async (ctx, { cursor, limit = 100, search, eventId, personId }) => {
    await requireAdmin(ctx);

    let memberships = await ctx.db.query('memberships').collect();

    // Filter by eventId if provided
    if (eventId) {
      memberships = memberships.filter(m => m.eventId === eventId);
    }

    // Filter by personId if provided
    if (personId) {
      memberships = memberships.filter(m => m.personId === personId);
    }

    // Enrich with person and event data for search
    const enrichedMemberships = await Promise.all(
      memberships.map(async membership => {
        const [person, event] = await Promise.all([
          ctx.db.get(membership.personId),
          ctx.db.get(membership.eventId),
        ]);

        const user = person ? await getUserInfo(ctx, person.userId) : null;

        return {
          membership,
          person,
          event,
          user,
        };
      })
    );

    // Apply search filter
    let filtered = enrichedMemberships;
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = enrichedMemberships.filter(
        ({ user, event }) =>
          (user?.name && user.name.toLowerCase().includes(searchLower)) ||
          (user?.email && user.email.toLowerCase().includes(searchLower)) ||
          (user?.username &&
            user.username.toLowerCase().includes(searchLower)) ||
          (event?.title && event.title.toLowerCase().includes(searchLower))
      );
    }

    const startIndex = cursor ? parseInt(cursor) : 0;
    const page = filtered.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < filtered.length;
    const nextCursor = hasMore ? (startIndex + limit).toString() : undefined;

    const result = page.map(({ membership, person, event, user }) => ({
      id: membership._id,
      role: membership.role,
      rsvpStatus: membership.rsvpStatus,
      personId: membership.personId,
      eventId: membership.eventId,
      createdAt: membership._id ? Date.now() : Date.now(), // memberships don't have _creationTime exposed
      person: user
        ? {
            id: person?._id,
            name: user.name,
            email: user.email,
            username: user.username,
          }
        : null,
      event: event
        ? {
            id: event._id,
            title: event.title,
          }
        : null,
    }));

    return {
      memberships: result,
      totalCount: filtered.length,
      nextCursor,
      hasMore,
    };
  },
});

/**
 * Get event members with user details
 */
export const getEventMembers = query({
  args: {
    eventId: v.id('events'),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { eventId, cursor, limit = 50 }) => {
    await requireAdmin(ctx);

    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();

    const startIndex = cursor ? parseInt(cursor) : 0;
    const page = memberships.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < memberships.length;
    const nextCursor = hasMore ? (startIndex + limit).toString() : undefined;

    const membersWithDetails = await Promise.all(
      page.map(async membership => {
        const person = await ctx.db.get(membership.personId);
        const user = person ? await getUserInfo(ctx, person.userId) : null;

        return {
          id: membership._id,
          role: membership.role,
          rsvpStatus: membership.rsvpStatus,
          personId: membership.personId,
          eventId: membership.eventId,
          person: user
            ? {
                id: person?._id,
                name: user.name,
                email: user.email,
                username: user.username,
                image: user.image,
              }
            : null,
        };
      })
    );

    return {
      members: membersWithDetails,
      totalCount: memberships.length,
      nextCursor,
      hasMore,
    };
  },
});

/**
 * Get user's posts across all events
 */
export const getUserPostsAcrossEvents = query({
  args: {
    personId: v.id('persons'),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { personId, cursor, limit = 50 }) => {
    await requireAdmin(ctx);

    const posts = await ctx.db
      .query('posts')
      .withIndex('by_author', q => q.eq('authorId', personId))
      .collect();

    const startIndex = cursor ? parseInt(cursor) : 0;
    const page = posts.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < posts.length;
    const nextCursor = hasMore ? (startIndex + limit).toString() : undefined;

    const postsWithDetails = await Promise.all(
      page.map(async post => {
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
          createdAt: post._creationTime,
          eventId: post.eventId,
          event: event
            ? {
                id: event._id,
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
      totalCount: posts.length,
      nextCursor,
      hasMore,
    };
  },
});

/**
 * Get an event with all relations expanded
 */
export const getEventWithRelations = query({
  args: {
    eventId: v.id('events'),
  },
  handler: async (ctx, { eventId }) => {
    await requireAdmin(ctx);

    const event = await ctx.db.get(eventId);
    if (!event) return null;

    // Get creator info
    const creator = await ctx.db.get(event.creatorId);
    const creatorUser = creator ? await getUserInfo(ctx, creator.userId) : null;

    // Get counts in parallel
    const [memberships, posts, invites, potentialDates] = await Promise.all([
      ctx.db
        .query('memberships')
        .withIndex('by_event', q => q.eq('eventId', eventId))
        .collect(),
      ctx.db
        .query('posts')
        .withIndex('by_event', q => q.eq('eventId', eventId))
        .collect(),
      ctx.db
        .query('invites')
        .withIndex('by_event', q => q.eq('eventId', eventId))
        .collect(),
      ctx.db
        .query('potentialDateTimes')
        .withIndex('by_event', q => q.eq('eventId', eventId))
        .collect(),
    ]);

    // Count replies across all posts
    const replyCount = await Promise.all(
      posts.map(post =>
        ctx.db
          .query('replies')
          .withIndex('by_post', q => q.eq('postId', post._id))
          .collect()
          .then(r => r.length)
      )
    ).then(counts => counts.reduce((sum, count) => sum + count, 0));

    return {
      id: event._id,
      title: event.title,
      description: event.description || null,
      location: event.location || null,
      chosenDateTime: event.chosenDateTime || null,
      chosenEndDateTime: event.chosenEndDateTime || null,
      timezone: event.timezone,
      creatorId: event.creatorId,
      createdAt: event._creationTime,
      updatedAt: event.updatedAt,
      creator: creatorUser
        ? {
            id: creator?._id,
            name: creatorUser.name,
            email: creatorUser.email,
            username: creatorUser.username,
          }
        : null,
      _count: {
        memberships: memberships.length,
        posts: posts.length,
        replies: replyCount,
        invites: invites.length,
        potentialDates: potentialDates.length,
      },
    };
  },
});

/**
 * Get a post with all relations expanded
 */
export const getPostWithRelations = query({
  args: {
    postId: v.id('posts'),
  },
  handler: async (ctx, { postId }) => {
    await requireAdmin(ctx);

    const post = await ctx.db.get(postId);
    if (!post) return null;

    // Get author and event info
    const [author, event] = await Promise.all([
      ctx.db.get(post.authorId),
      ctx.db.get(post.eventId),
    ]);

    const authorUser = author ? await getUserInfo(ctx, author.userId) : null;

    // Get reply count
    const replies = await ctx.db
      .query('replies')
      .withIndex('by_post', q => q.eq('postId', postId))
      .collect();

    return {
      id: post._id,
      title: post.title,
      content: post.content,
      createdAt: post._creationTime,
      editedAt: post.editedAt,
      authorId: post.authorId,
      eventId: post.eventId,
      membershipId: post.membershipId || null,
      author: authorUser
        ? {
            id: author?._id,
            name: authorUser.name,
            email: authorUser.email,
            username: authorUser.username,
            image: authorUser.image,
          }
        : null,
      event: event
        ? {
            id: event._id,
            title: event.title,
          }
        : null,
      _count: {
        replies: replies.length,
      },
    };
  },
});

/**
 * Get replies for a post
 */
export const getPostReplies = query({
  args: {
    postId: v.id('posts'),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { postId, cursor, limit = 50 }) => {
    await requireAdmin(ctx);

    const replies = await ctx.db
      .query('replies')
      .withIndex('by_post', q => q.eq('postId', postId))
      .collect();

    const startIndex = cursor ? parseInt(cursor) : 0;
    const page = replies.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < replies.length;
    const nextCursor = hasMore ? (startIndex + limit).toString() : undefined;

    const repliesWithDetails = await Promise.all(
      page.map(async reply => {
        const author = await ctx.db.get(reply.authorId);
        const authorUser = author
          ? await getUserInfo(ctx, author.userId)
          : null;

        return {
          id: reply._id,
          text: reply.text,
          createdAt: reply._creationTime,
          authorId: reply.authorId,
          postId: reply.postId,
          author: authorUser
            ? {
                id: author?._id,
                name: authorUser.name,
                email: authorUser.email,
                username: authorUser.username,
              }
            : null,
        };
      })
    );

    return {
      replies: repliesWithDetails,
      totalCount: replies.length,
      nextCursor,
      hasMore,
    };
  },
});

/**
 * Get event posts with details
 */
export const getEventPosts = query({
  args: {
    eventId: v.id('events'),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { eventId, cursor, limit = 50 }) => {
    await requireAdmin(ctx);

    const posts = await ctx.db
      .query('posts')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();

    const startIndex = cursor ? parseInt(cursor) : 0;
    const page = posts.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < posts.length;
    const nextCursor = hasMore ? (startIndex + limit).toString() : undefined;

    const postsWithDetails = await Promise.all(
      page.map(async post => {
        const author = await ctx.db.get(post.authorId);
        const authorUser = author
          ? await getUserInfo(ctx, author.userId)
          : null;

        const replyCount = await ctx.db
          .query('replies')
          .withIndex('by_post', q => q.eq('postId', post._id))
          .collect()
          .then(r => r.length);

        return {
          id: post._id,
          title: post.title,
          content: post.content,
          createdAt: post._creationTime,
          authorId: post.authorId,
          author: authorUser
            ? {
                id: author?._id,
                name: authorUser.name,
                email: authorUser.email,
                username: authorUser.username,
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
      totalCount: posts.length,
      nextCursor,
      hasMore,
    };
  },
});
