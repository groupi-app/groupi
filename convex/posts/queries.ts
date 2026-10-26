import { postControls, controlFields, pinnedPosts } from './controls';
import { postDocument } from './model';
import { requireDiscussionRole } from '../lib/discussionAccess';
import { requireEventPost } from '../lib/discussionAccess';
import { requireNoEventExclusion } from '../groups/exclusions';
import { getDiscussionActorWithUser } from '../posts/presentation';
import { canViewAttendance, privateNote } from '../events/attendance';
import { query } from '../_generated/server';
import { v } from 'convex/values';
import {
  paginationOptsValidator,
  paginationResultValidator,
} from 'convex/server';
import { requireAuth } from '../auth';

const postFeedItemValidator = v.object({
  _id: v.id('posts'),
  _creationTime: v.number(),
  title: v.string(),
  content: v.string(),
  editedAt: v.optional(v.number()),
  membershipId: v.optional(v.id('memberships')),
  authorId: v.union(v.id('persons'), v.id('authorizationPrincipals')),
  eventId: v.id('events'),
  updatedAt: v.optional(v.number()),
  ...controlFields,
  author: v.object({
    kind: v.union(v.literal('user'), v.literal('integration')),
    name: v.union(v.string(), v.null()),
    image: v.union(v.string(), v.null()),
  }),
});

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
    const storedPost = await ctx.db.get(postId);
    const post = storedPost ? requireEventPost(storedPost) : null;
    if (!post) {
      return null;
    }

    // Get the event - return null if not found
    const event = await ctx.db.get(post.eventId);
    if (!event) {
      return null;
    }

    await requireNoEventExclusion(ctx, post.eventId, currentPerson._id);
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
      Awaited<ReturnType<typeof getDiscussionActorWithUser>>
    >;
    const personMap = new Map<string, PersonData>();
    const batchedData = await Promise.all(
      [...authorIds].map(id =>
        getDiscussionActorWithUser(ctx, id).then(data => ({ id, data }))
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
                kind: replyAuthorData.kind,
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
        ...postControls(
          post,
          currentPerson._id,
          userMembership.role !== 'ATTENDEE'
        ),
        author: postAuthorData
          ? {
              kind: postAuthorData.kind,
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
    excludePinned: v.optional(v.boolean()),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId, excludePinned }) => {
    const exclusionPerson = (await requireAuth(ctx)).person;
    await requireNoEventExclusion(ctx, eventId, exclusionPerson._id);
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
      (excludePinned
        ? ctx.db
            .query('posts')
            .withIndex('by_event_and_pinnedAt', q =>
              q.eq('eventId', eventId).eq('pinnedAt', undefined)
            )
        : ctx.db
            .query('posts')
            .withIndex('by_event', q => q.eq('eventId', eventId))
      )
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
      Awaited<ReturnType<typeof getDiscussionActorWithUser>>
    >;
    const personMap = new Map<string, PersonData>();
    const batchedData = await Promise.all(
      [...personIds].map(id =>
        getDiscussionActorWithUser(ctx, id).then(data => ({ id, data }))
      )
    );
    for (const { id, data } of batchedData) {
      if (data) personMap.set(id, data);
    }

    // Build posts with authors using the map
    const postsWithAuthors = posts.map(storedPost => {
      const post = requireEventPost(storedPost);
      const authorData = personMap.get(post.authorId as string);
      const replies = postRepliesMap.get(post._id) || [];

      const seenAuthors = new Set<string>();
      const recentReplyAuthors: Array<{
        id: string;
        kind: 'user' | 'integration';
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
            kind: replyAuthorData.kind,
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
        ...postControls(
          post,
          currentPerson._id,
          userMembership.role !== 'ATTENDEE'
        ),
        author: authorData
          ? {
              kind: authorData.kind,
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
    const visibleMemberships = canViewAttendance(event, userMembership)
      ? eventMemberships
      : [userMembership];
    const membershipsWithUsers = visibleMemberships.map(membership => {
      const memberData = personMap.get(membership.personId as string);
      return {
        ...membership,
        rsvpNote: privateNote(membership.rsvpNote, userMembership, membership),
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
 * Get a cursor-paginated, card-sized post feed for native clients.
 *
 * This deliberately omits the event membership graph and reply documents.
 * Those are already loaded by dedicated event/detail queries, and including
 * them here would make every page grow with the lifetime of the event.
 */
export const getEventPostFeedPage = query({
  args: {
    eventId: v.id('events'),
    excludePinned: v.optional(v.boolean()),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(postFeedItemValidator),
  handler: async (ctx, { eventId, paginationOpts, excludePinned }) => {
    const { person: currentPerson } = await requireAuth(ctx);
    const boundedPaginationOpts = {
      ...paginationOpts,
      numItems: Math.min(Math.max(Math.trunc(paginationOpts.numItems), 1), 50),
    };

    const event = await ctx.db.get(eventId);

    if (!event) {
      const emptyResult = await ctx.db
        .query('posts')
        .withIndex('by_event', q => q.eq('eventId', eventId))
        .paginate(boundedPaginationOpts);
      return { ...emptyResult, page: [] };
    }

    await requireNoEventExclusion(ctx, eventId, currentPerson._id);
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', currentPerson._id).eq('eventId', eventId)
      )
      .first();

    if (!membership) {
      throw new Error('You are not a member of this event');
    }

    const source = excludePinned
      ? ctx.db
          .query('posts')
          .withIndex('by_event_and_pinnedAt', q =>
            q.eq('eventId', eventId).eq('pinnedAt', undefined)
          )
      : ctx.db
          .query('posts')
          .withIndex('by_event', q => q.eq('eventId', eventId));
    const result = await source.order('desc').paginate(boundedPaginationOpts);

    const authorIds = [...new Set(result.page.map(post => post.authorId))];
    const authors = await Promise.all(
      authorIds.map(async personId => ({
        personId,
        data: await getDiscussionActorWithUser(ctx, personId),
      }))
    );
    const authorMap = new Map(
      authors.map(({ personId, data }) => [personId, data ?? null])
    );

    return {
      ...result,
      page: result.page.map(storedPost => {
        const post = requireEventPost(storedPost);
        const author = authorMap.get(post.authorId);
        return {
          ...post,
          ...postControls(
            post,
            currentPerson._id,
            membership.role !== 'ATTENDEE'
          ),
          author: {
            kind: author?.kind ?? 'user',
            name: author?.user.name ?? null,
            image: author?.user.image ?? null,
          },
        };
      }),
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
    const { person: currentPerson } = await requireAuth(ctx);
    const storedPost = await ctx.db.get(postId);
    const post = storedPost ? requireEventPost(storedPost) : null;
    if (!post) {
      throw new Error('Post not found');
    }

    await requireNoEventExclusion(ctx, post.eventId, currentPerson._id);
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', currentPerson._id).eq('eventId', post.eventId)
      )
      .first();

    if (!membership) {
      throw new Error('Access denied to this post');
    }

    return {
      ...post,
      ...postControls(post, currentPerson._id, membership.role !== 'ATTENDEE'),
    };
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
    const { person: currentPerson } = await requireAuth(ctx);
    // Verify access to the post
    const storedPost = await ctx.db.get(postId);
    const post = storedPost ? requireEventPost(storedPost) : null;
    if (!post) {
      throw new Error('Post not found');
    }

    await requireNoEventExclusion(ctx, post.eventId, currentPerson._id);
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', currentPerson._id).eq('eventId', post.eventId)
      )
      .first();

    if (!membership) {
      throw new Error('Access denied to this post');
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
        const authorData = await getDiscussionActorWithUser(
          ctx,
          reply.authorId
        );
        return {
          ...reply,
          author: authorData
            ? {
                kind: authorData.kind,
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

const pinnedUser = v.object({
  _id: v.string(),
  name: v.union(v.string(), v.null()),
  username: v.union(v.string(), v.null()),
  email: v.union(v.string(), v.null()),
  image: v.union(v.string(), v.null()),
});
const pinnedFeedPost = v.object({
  ...postDocument.fields,
  eventId: v.id('events'),
  ...controlFields,
  author: v.union(
    v.object({
      kind: v.union(v.literal('user'), v.literal('integration')),
      user: pinnedUser,
      person: v.object({
        _id: v.union(v.id('persons'), v.id('authorizationPrincipals')),
        user: pinnedUser,
      }),
    }),
    v.null()
  ),
  replyCount: v.number(),
  recentReplyAuthors: v.array(
    v.object({
      id: v.string(),
      kind: v.union(v.literal('user'), v.literal('integration')),
      _creationTime: v.number(),
      user: v.object({
        name: v.union(v.string(), v.null()),
        email: v.string(),
        image: v.union(v.string(), v.null()),
      }),
    })
  ),
});
export const getPinnedEventPosts = query({
  args: { eventId: v.id('events') },
  returns: v.array(pinnedFeedPost),
  handler: async (ctx, { eventId }) => {
    const { person } = await requireAuth(ctx);
    const membership = await requireDiscussionRole(
      ctx,
      eventId,
      person._id,
      'ATTENDEE'
    );
    return Promise.all(
      (await pinnedPosts(ctx, { eventId })).map(async storedPost => {
        const post = requireEventPost(storedPost);
        const actor = await getDiscussionActorWithUser(ctx, post.authorId);
        const user = actor
          ? {
              _id: actor.user._id,
              name: actor.user.name ?? null,
              username: actor.user.username ?? null,
              email: actor.user.email ?? null,
              image: actor.user.image ?? null,
            }
          : null;
        const replies = await ctx.db
          .query('replies')
          .withIndex('by_post', q => q.eq('postId', post._id))
          .order('desc')
          .collect();
        const seen = new Set<string>();
        const recentReplyAuthors = [];
        for (const reply of replies) {
          if (seen.has(reply.authorId)) continue;
          seen.add(reply.authorId);
          const by = await getDiscussionActorWithUser(ctx, reply.authorId);
          if (by)
            recentReplyAuthors.push({
              id: String(reply.authorId),
              kind: by.kind,
              _creationTime: reply._creationTime,
              user: {
                name: by.user.name ?? null,
                email: by.user.email ?? '',
                image: by.user.image ?? null,
              },
            });
          if (recentReplyAuthors.length === 3) break;
        }
        return {
          ...post,
          ...postControls(post, person._id, membership.role !== 'ATTENDEE'),
          author:
            actor && user
              ? {
                  kind: actor.kind,
                  user,
                  person: { _id: actor.person._id, user },
                }
              : null,
          replyCount: replies.length,
          recentReplyAuthors,
        };
      })
    );
  },
});
