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

    // Fetch replies and post attachments in parallel
    const [replies, postAttachments] = await Promise.all([
      ctx.db
        .query('replies')
        .withIndex('by_post', q => q.eq('postId', post._id))
        .order('asc')
        .collect(),
      ctx.db
        .query('attachments')
        .withIndex('by_post', q => q.eq('postId', post._id))
        .collect(),
    ]);

    // Batch-fetch all unique authors (post + replies) to avoid N+1
    const authorIds = new Set<string>([post.authorId as string]);
    for (const reply of replies) {
      authorIds.add(reply.authorId as string);
    }

    type PersonData = NonNullable<
      Awaited<ReturnType<typeof getPersonWithUser>>
    >;
    const personMap = new Map<string, PersonData>();
    const batchedData = await Promise.all(
      [...authorIds].map(id =>
        getPersonWithUser(ctx, id).then(data => ({ id, data }))
      )
    );
    for (const { id, data } of batchedData) {
      if (data) personMap.set(id, data);
    }

    const postAuthorData = personMap.get(post.authorId as string);

    const postAttachmentsWithUrls = await Promise.all(
      postAttachments.map(async attachment => ({
        ...attachment,
        url: await ctx.storage.getUrl(attachment.storageId),
      }))
    );

    const repliesWithAuthors = await Promise.all(
      replies.map(async reply => {
        const replyAuthorData = personMap.get(reply.authorId as string);

        const replyAttachments = await ctx.db
          .query('attachments')
          .withIndex('by_reply', q => q.eq('replyId', reply._id))
          .collect();

        const replyAttachmentsWithUrls = await Promise.all(
          replyAttachments.map(async attachment => ({
            ...attachment,
            url: await ctx.storage.getUrl(attachment.storageId),
          }))
        );

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
          attachments: replyAttachmentsWithUrls,
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
        event,
        replies: repliesWithAuthors.filter(r => r.author !== null),
        attachments: postAttachmentsWithUrls,
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

    // Get all posts and memberships for this event
    const [posts, eventMemberships] = await Promise.all([
      ctx.db
        .query('posts')
        .withIndex('by_event', q => q.eq('eventId', eventId))
        .order('desc')
        .collect(),
      ctx.db
        .query('memberships')
        .withIndex('by_event', q => q.eq('eventId', eventId))
        .collect(),
    ]);

    // Fetch replies for all posts in parallel
    const allPostReplies = await Promise.all(
      posts.map(async post => ({
        postId: post._id,
        replies: await ctx.db
          .query('replies')
          .withIndex('by_post', q => q.eq('postId', post._id))
          .order('desc')
          .collect(),
      }))
    );

    const postRepliesMap = new Map(
      allPostReplies.map(({ postId, replies }) => [postId, replies])
    );

    // Collect all unique person IDs to batch-fetch
    const personIds = new Set<string>();
    for (const post of posts) {
      personIds.add(post.authorId as string);
    }
    for (const { replies } of allPostReplies) {
      const seen = new Set<string>();
      for (const reply of replies) {
        if (seen.size >= 3) break;
        if (!seen.has(reply.authorId as string)) {
          seen.add(reply.authorId as string);
          personIds.add(reply.authorId as string);
        }
      }
    }
    for (const membership of eventMemberships) {
      personIds.add(membership.personId as string);
    }

    // Batch-fetch all unique persons once
    type PersonData = NonNullable<
      Awaited<ReturnType<typeof getPersonWithUser>>
    >;
    const personMap = new Map<string, PersonData>();
    const batchedData = await Promise.all(
      [...personIds].map(id =>
        getPersonWithUser(ctx, id).then(data => ({ id, data }))
      )
    );
    for (const { id, data } of batchedData) {
      if (data) personMap.set(id, data);
    }

    // Build posts with authors using the map
    const postsWithAuthors = posts.map(post => {
      const authorData = personMap.get(post.authorId as string);
      const replies = postRepliesMap.get(post._id) || [];

      const seenAuthors = new Set<string>();
      const recentReplyAuthors: Array<{
        id: string;
        _creationTime: number;
        user: {
          name: string | null;
          email: string;
          image: string | null;
        } | null;
      }> = [];

      for (const reply of replies) {
        if (seenAuthors.has(reply.authorId)) continue;
        if (recentReplyAuthors.length >= 3) break;

        const replyAuthorData = personMap.get(reply.authorId as string);
        if (replyAuthorData?.user) {
          seenAuthors.add(reply.authorId);
          recentReplyAuthors.push({
            id: reply.authorId,
            _creationTime: reply._creationTime,
            user: {
              name: replyAuthorData.user.name ?? null,
              email: replyAuthorData.user.email ?? '',
              image: replyAuthorData.user.image ?? null,
            },
          });
        }
      }

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
        replyCount: replies.length,
        recentReplyAuthors,
      };
    });

    // Build memberships with users using the same map
    const membershipsWithUsers = eventMemberships.map(membership => {
      const memberData = personMap.get(membership.personId as string);
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
    });

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
