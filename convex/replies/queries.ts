import { query } from '../_generated/server';
import { v } from 'convex/values';
import { getCurrentPerson, getPersonWithUser } from '../auth';

/**
 * Replies queries for the Convex backend
 *
 * These functions handle reply data retrieval with proper authentication.
 */

/**
 * Get replies for a specific post
 */
export const getRepliesByPost = query({
  args: {
    postId: v.id('posts'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { postId }) => {
    // Get the post first
    const post = await ctx.db.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Verify user has access to this post's event
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

    // Get all replies for this post
    const replies = await ctx.db
      .query('replies')
      .withIndex('by_post', q => q.eq('postId', postId))
      .order('asc')
      .collect();

    // Enrich replies with author data - nest user inside person
    const enrichedReplies = await Promise.all(
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
      replies: enrichedReplies,
      post: {
        ...post,
        id: post._id,
      },
    };
  },
});
