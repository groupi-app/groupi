import { query } from '../_generated/server';
import { v } from 'convex/values';
import { getCurrentPerson, requireAuth, getPersonWithUser } from '../auth';

/**
 * Posts queries for the Convex backend
 *
 * These functions replace the old React Query + Prisma patterns
 * with Convex real-time subscriptions and optimized database queries.
 */

/**
 * Get detailed post information with all related data
 * Equivalent to the old fetchPostDetail function
 */
export const getPostDetail = query({
  args: {
    postId: v.id('posts'),
    _traceId: v.optional(v.string()), // For logging/debugging
  },
  handler: async (ctx, { postId }) => {
    // Require authentication
    const { person: currentPerson, user: currentUser } = await requireAuth(ctx);

    // Get the post - return null if not found (e.g., after deletion)
    const post = await ctx.db.get(postId);
    if (!post) {
      return null;
    }

    // Get the event - return null if not found
    const event = await ctx.db.get(post.eventId);
    if (!event) {
      return null;
    }

    // Check if user is a member of the event
    const userMembership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', currentPerson._id).eq('eventId', event._id)
      )
      .first();

    if (!userMembership) {
      throw new Error('You are not a member of this event');
    }

    // Get all event memberships for context
    const eventMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_event', q => q.eq('eventId', event._id))
      .collect();

    // Get user data for all members - nest user inside person AND at top level for compatibility
    const membershipsWithUsers = await Promise.all(
      eventMemberships.map(async membership => {
        const memberData = await getPersonWithUser(ctx, membership.personId);
        return {
          ...membership,
          person: memberData
            ? {
                ...memberData.person,
                user: memberData.user,
              }
            : null,
          user: memberData?.user || null,
        };
      })
    );

    // Get post author data - nest user inside person
    const postAuthorData = await getPersonWithUser(ctx, post.authorId);

    // Get replies for this post
    const replies = await ctx.db
      .query('replies')
      .withIndex('by_post', q => q.eq('postId', post._id))
      .order('asc')
      .collect();

    // Get user data for reply authors - nest user inside person
    const repliesWithAuthors = await Promise.all(
      replies.map(async reply => {
        const replyAuthorData = await getPersonWithUser(ctx, reply.authorId);
        return {
          ...reply,
          author: replyAuthorData
            ? {
                person: {
                  ...replyAuthorData.person,
                  user: replyAuthorData.user,
                },
                user: replyAuthorData.user,
              }
            : null,
        };
      })
    );

    return {
      post: {
        ...post,
        author: postAuthorData
          ? {
              person: {
                ...postAuthorData.person,
                user: postAuthorData.user,
              },
              user: postAuthorData.user,
            }
          : null,
        event: {
          ...event,
          memberships: membershipsWithUsers.filter(
            m => m.person && m.person.user
          ),
        },
        replies: repliesWithAuthors.filter(r => r.author !== null),
      },
      userMembership: {
        ...userMembership,
        person: {
          ...currentPerson,
          user: currentUser,
        },
      },
    };
  },
});

/**
 * Get posts for an event feed (paginated)
 * Used for event post lists
 */
export const getEventPostFeed = query({
  args: {
    eventId: v.id('events'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId }) => {
    // Require authentication and event membership
    const { person: currentPerson } = await requireAuth(ctx);

    // Check event membership
    const userMembership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', currentPerson._id).eq('eventId', eventId)
      )
      .first();

    if (!userMembership) {
      throw new Error('You are not a member of this event');
    }

    // Get event
    const event = await ctx.db.get(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Get all posts for this event
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .order('desc') // Most recent first
      .collect();

    // Get author data for all posts - nest user inside person
    const postsWithAuthors = await Promise.all(
      posts.map(async post => {
        const authorData = await getPersonWithUser(ctx, post.authorId);

        // Get reply count
        const replyCount = await ctx.db
          .query('replies')
          .withIndex('by_post', q => q.eq('postId', post._id))
          .collect()
          .then(replies => replies.length);

        return {
          ...post,
          author: authorData
            ? {
                person: {
                  ...authorData.person,
                  user: authorData.user,
                },
                user: authorData.user,
              }
            : null,
          replyCount,
        };
      })
    );

    // Get event memberships - nest user inside person
    const eventMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();

    const membershipsWithUsers = await Promise.all(
      eventMemberships.map(async membership => {
        const memberData = await getPersonWithUser(ctx, membership.personId);
        return {
          ...membership,
          // Include user at top level AND nested in person for component compatibility
          person: memberData
            ? {
                ...memberData.person,
                user: memberData.user,
              }
            : null,
          user: memberData?.user || null,
        };
      })
    );

    return {
      event: {
        ...event,
        posts: postsWithAuthors.filter(p => p.author !== null),
        memberships: membershipsWithUsers.filter(
          m => m.person && m.person.user
        ),
      },
      userMembership: {
        ...userMembership,
        person: currentPerson,
      },
    };
  },
});

/**
 * Get a single post with minimal data
 * Used for quick lookups and optimistic updates
 */
export const getPost = query({
  args: {
    postId: v.id('posts'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Check if current user has access to this post's event
    const currentPerson = await getCurrentPerson(ctx);
    if (currentPerson) {
      const membership = await ctx.db
        .query('memberships')
        .withIndex('by_person_event', q =>
          q.eq('personId', currentPerson._id).eq('eventId', post.eventId)
        )
        .first();

      if (!membership) {
        throw new Error('Access denied to this post');
      }
    }

    return post;
  },
});

/**
 * Get replies for a specific post
 * Used by the replies components
 */
export const getPostReplies = query({
  args: {
    postId: v.id('posts'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { postId }) => {
    // Verify access to the post
    const post = await ctx.db.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const currentPerson = await getCurrentPerson(ctx);
    if (currentPerson) {
      const membership = await ctx.db
        .query('memberships')
        .withIndex('by_person_event', q =>
          q.eq('personId', currentPerson._id).eq('eventId', post.eventId)
        )
        .first();

      if (!membership) {
        throw new Error('Access denied to this post');
      }
    }

    // Get all replies
    const replies = await ctx.db
      .query('replies')
      .withIndex('by_post', q => q.eq('postId', postId))
      .order('asc') // Chronological order
      .collect();

    // Get author data for all replies - nest user inside person
    const repliesWithAuthors = await Promise.all(
      replies.map(async reply => {
        const authorData = await getPersonWithUser(ctx, reply.authorId);
        return {
          ...reply,
          author: authorData
            ? {
                person: {
                  ...authorData.person,
                  user: authorData.user,
                },
                user: authorData.user,
              }
            : null,
        };
      })
    );

    return {
      replies: repliesWithAuthors.filter(r => r.author !== null),
    };
  },
});
