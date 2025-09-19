import { Effect } from 'effect';
import { z } from 'zod';
import { db } from './db';
import { getPusherServer } from './pusher-server';
import { getEventQuery, getPersonQuery } from '@groupi/schema/queries';
import {
  PostPageDTO,
  PostReplyFeedDTO,
  PostWithEventDTO,
  RoleSchema,
  CreatePostInput,
  UpdatePostInput,
} from '@groupi/schema';
import { createEventNotifs } from './notification';
import { SentryHelpers } from './sentry';
import { safeWrapper } from './shared/safe-wrapper';

// Import shared patterns
import {
  dbOperation,
  externalServiceOperation,
} from './shared/effect-patterns';

import {
  createPostPageDTO,
  PostWithReplies,
  createPostReplyFeedDTO,
  PostWithEvent,
  PostSchema,
} from '@groupi/schema';
import { OperationSuccessSchema } from './shared/operations';

// ============================================================================
// ZOD SCHEMAS FOR RETURN TYPES
// ============================================================================

// Schema for created posts
export const CreatedPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  authorId: z.string(),
  eventId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  editedAt: z.date().nullable(),
});

// Re-export DTO schemas for consistency
export const PostPageDataSchema = PostPageDTO;
export const PostDataSchema = PostWithEventDTO;

// Aggregated schema for post page data returned to clients
export const PostPageDataResponseSchema = z.object({
  post: PostPageDTO,
  userId: z.string(),
  userRole: RoleSchema,
});

// Aggregated schema for reply feed data returned to clients
export const PostReplyFeedDataSchema = z.object({
  post: PostReplyFeedDTO,
  userId: z.string(),
  userRole: RoleSchema,
});

// ============================================================================
// ERROR TYPES
// ============================================================================

export class PostNotFoundError extends Error {
  readonly _tag = 'PostNotFoundError';
  constructor(postId: string) {
    super(`Post not found: ${postId}`);
  }
}

export class PostUserNotFoundError extends Error {
  readonly _tag = 'PostUserNotFoundError';
  constructor() {
    super('User not found');
  }
}

export class PostUserNotMemberError extends Error {
  readonly _tag = 'PostUserNotMemberError';
  constructor(eventId: string, userId: string) {
    super(`User ${userId} is not a member of event ${eventId}`);
  }
}

export class PostCreationError extends Error {
  readonly _tag = 'PostCreationError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to create post');
    if (cause) {
      this.cause = cause;
    }
  }
}

export class PostUpdateError extends Error {
  readonly _tag = 'PostUpdateError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to update post');
    if (cause) {
      this.cause = cause;
    }
  }
}

export class PostDeletionError extends Error {
  readonly _tag = 'PostDeletionError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to delete post');
    if (cause) {
      this.cause = cause;
    }
  }
}

export class PostUnauthorizedError extends Error {
  readonly _tag = 'PostUnauthorizedError';
  constructor(message: string) {
    super(message);
  }
}

// ============================================================================
// EFFECT FUNCTIONS (Core Business Logic)
// ============================================================================

// Modernized Effect-based function to fetch post page data
export const fetchPostPageDataEffect = (postId: string, userId: string) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch post with all related data (database operation with retry)
      const post = yield* _(
        dbOperation(
          () =>
            db.post.findUnique({
              where: { id: postId },
              include: {
                replies: {
                  include: {
                    author: true,
                  },
                },
                author: true,
                event: {
                  include: {
                    memberships: {
                      include: {
                        person: true,
                      },
                    },
                  },
                },
              },
            }),
          _error => new PostNotFoundError(postId),
          `Fetch post page data for post: ${postId}`
        )
      );

      if (!post) {
        return yield* _(Effect.fail(new PostNotFoundError(postId)));
      }

      // Check if user is a member of the event (business logic - no retry)
      const userMembership = post.event.memberships.find(
        membership => membership.personId === userId
      );

      if (!userMembership) {
        return yield* _(
          Effect.fail(new PostUserNotMemberError(post.eventId, userId))
        );
      }

      // Transform to DTO for post page display
      const postDTO = createPostPageDTO(post as PostWithReplies);

      return {
        post: postDTO,
        userId,
        userRole: userMembership.role,
      };
    }),
    'post',
    'fetchPostPageData',
    postId
  );

// Modernized Effect-based function to fetch post with event data
export const fetchReplyFeedDataEffect = (postId: string, userId: string) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch post with event context (database operation with retry)
      const post = yield* _(
        dbOperation(
          () =>
            db.post.findUnique({
              where: { id: postId },
              include: {
                replies: {
                  include: {
                    author: true,
                  },
                },
                author: true,
                event: {
                  include: {
                    memberships: {
                      include: {
                        person: true,
                      },
                    },
                  },
                },
              },
            }),
          _error => new PostNotFoundError(postId),
          `Fetch post with event data for post: ${postId}`
        )
      );

      if (!post) {
        return yield* _(Effect.fail(new PostNotFoundError(postId)));
      }

      // Check if user is a member (business logic - no retry)
      const userMembership = post.event.memberships.find(
        membership => membership.personId === userId
      );

      if (!userMembership) {
        return yield* _(
          Effect.fail(new PostUserNotMemberError(post.eventId, userId))
        );
      }

      // Transform to DTO with event context
      const postDTO = createPostReplyFeedDTO(post as PostWithEvent);

      return {
        post: postDTO,
        userId,
        userRole: userMembership.role,
      };
    }),
    'post',
    'fetchPostWithEventData',
    postId
  );

// Modernized Effect-based function to create a post
export const createPostEffect = (postData: CreatePostInput, userId: string) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch event and check membership (database operation with retry)
      const event = yield* _(
        dbOperation(
          () =>
            db.event.findUnique({
              where: { id: postData.eventId },
              include: {
                memberships: true,
              },
            }),
          _error => new PostCreationError(null),
          `Fetch event for post creation: ${postData.eventId}`
        )
      );

      if (!event) {
        return yield* _(Effect.fail(new PostCreationError('Event not found')));
      }

      // Check if user is a member (business logic - no retry)
      const userMembership = event.memberships.find(
        membership => membership.personId === userId
      );

      if (!userMembership) {
        return yield* _(
          Effect.fail(new PostUserNotMemberError(postData.eventId, userId))
        );
      }

      // Create the post (database operation with retry)
      const post = yield* _(
        dbOperation(
          () =>
            db.post.create({
              data: {
                title: postData.title,
                content: postData.content,
                eventId: postData.eventId,
                authorId: userId,
              },
            }),
          _error => new PostCreationError(null),
          `Create post: ${postData.title}`
        )
      );

      // Update event's updatedAt timestamp (database operation with retry)
      yield* _(
        dbOperation(
          () =>
            db.event.update({
              where: { id: postData.eventId },
              data: { updatedAt: new Date() },
            }),
          _error => new PostCreationError(null),
          `Update event timestamp for post creation: ${postData.eventId}`
        )
      );

      // Send pusher notifications (external service - retry with graceful degradation)
      const eventQueryDefinition = getEventQuery(postData.eventId);
      const events = [
        {
          channel: eventQueryDefinition.pusherChannel,
          name: eventQueryDefinition.pusherEvent,
          data: { message: 'Data updated' },
        },
      ];

      for (const membership of event.memberships) {
        const personQueryDefinition = getPersonQuery(membership.personId);
        events.push({
          channel: personQueryDefinition.pusherChannel,
          name: personQueryDefinition.pusherEvent,
          data: { message: 'Data updated' },
        });
      }

      if (events.length > 0) {
        yield* _(
          externalServiceOperation(
            () => getPusherServer().triggerBatch(events),
            _error => new Error('Failed to send pusher notifications'),
            `Send pusher notifications for post creation: ${post.id}`
          )
        );
      }

      // Send event notifications (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          async () => {
            const [error, result] = await createEventNotifs(
              postData.eventId,
              'NEW_POST',
              userId,
              post.id
            );
            if (error) throw error;
            return result;
          },
          _error => new Error('Failed to create event notifications'),
          `Create event notifications for post: ${post.id}`
        )
      );

      return post;
    }),
    'post',
    'createPost',
    postData.eventId
  );

// Modernized Effect-based function to update a post
export const updatePostEffect = (postData: UpdatePostInput, userId: string) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch post with event and memberships (database operation with retry)
      const post = yield* _(
        dbOperation(
          () =>
            db.post.findUnique({
              where: { id: postData.postId },
              include: {
                event: {
                  include: {
                    memberships: true,
                  },
                },
              },
            }),
          _error => new PostNotFoundError(postData.postId),
          `Fetch post for update: ${postData.postId}`
        )
      );

      if (!post) {
        return yield* _(Effect.fail(new PostNotFoundError(postData.postId)));
      }

      // Check if user is the author or has permission (business logic - no retry)
      const userMembership = post.event.memberships.find(
        membership => membership.personId === userId
      );

      if (!userMembership) {
        return yield* _(
          Effect.fail(new PostUserNotMemberError(post.eventId, userId))
        );
      }

      if (
        post.authorId !== userId &&
        userMembership.role !== 'ORGANIZER' &&
        userMembership.role !== 'MODERATOR'
      ) {
        return yield* _(
          Effect.fail(
            new PostUnauthorizedError(
              'You do not have permission to edit this post'
            )
          )
        );
      }

      // Update the post (database operation with retry)
      const updatedPost = yield* _(
        dbOperation(
          () =>
            db.post.update({
              where: { id: postData.postId },
              data: {
                title: postData.title,
                content: postData.content,
                updatedAt: new Date(),
              },
            }),
          _error => new PostUpdateError(null),
          `Update post: ${postData.postId}`
        )
      );

      // Send pusher notifications (external service - retry with graceful degradation)
      const eventQueryDefinition = getEventQuery(post.eventId);
      yield* _(
        externalServiceOperation(
          () =>
            getPusherServer().trigger(
              eventQueryDefinition.pusherChannel,
              eventQueryDefinition.pusherEvent,
              { message: 'Data updated' }
            ),
          _error => new Error('Failed to send pusher notifications'),
          `Send pusher notifications for post update: ${postData.postId}`
        )
      );

      return updatedPost;
    }),
    'post',
    'updatePost',
    postData.postId
  );

// Modernized Effect-based function to delete a post
export const deletePostEffect = (postId: string, userId: string) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch post with event and memberships (database operation with retry)
      const post = yield* _(
        dbOperation(
          () =>
            db.post.findUnique({
              where: { id: postId },
              include: {
                event: {
                  include: {
                    memberships: true,
                  },
                },
              },
            }),
          _error => new PostNotFoundError(postId),
          `Fetch post for deletion: ${postId}`
        )
      );

      if (!post) {
        return yield* _(Effect.fail(new PostNotFoundError(postId)));
      }

      // Check if user is the author or has permission (business logic - no retry)
      const userMembership = post.event.memberships.find(
        membership => membership.personId === userId
      );

      if (!userMembership) {
        return yield* _(
          Effect.fail(new PostUserNotMemberError(post.eventId, userId))
        );
      }

      if (
        post.authorId !== userId &&
        userMembership.role !== 'ORGANIZER' &&
        userMembership.role !== 'MODERATOR'
      ) {
        return yield* _(
          Effect.fail(
            new PostUnauthorizedError(
              'You do not have permission to delete this post'
            )
          )
        );
      }

      // Delete the post (database operation with retry, cascade will handle replies)
      yield* _(
        dbOperation(
          () =>
            db.post.delete({
              where: { id: postId },
            }),
          _error => new PostDeletionError(null),
          `Delete post: ${postId}`
        )
      );

      // Send pusher notifications (external service - retry with graceful degradation)
      const eventQueryDefinition = getEventQuery(post.eventId);
      yield* _(
        externalServiceOperation(
          () =>
            getPusherServer().trigger(
              eventQueryDefinition.pusherChannel,
              eventQueryDefinition.pusherEvent,
              { message: 'Data updated' }
            ),
          _error => new Error('Failed to send pusher notifications'),
          `Send pusher notifications for post deletion: ${postId}`
        )
      );

      return { message: 'Post Deleted' };
    }),
    'post',
    'deletePost',
    postId
  );

// ============================================================================
// SAFE WRAPPERS WITH CUSTOM ERROR TYPES
// ============================================================================

export const fetchPostPageData = safeWrapper<
  [string, string],
  z.infer<typeof PostPageDataResponseSchema>,
  PostNotFoundError | PostUserNotMemberError
>(
  (postId: string, userId: string) =>
    Effect.runPromise(fetchPostPageDataEffect(postId, userId)),
  PostPageDataResponseSchema
);

export const fetchReplyFeedData = safeWrapper<
  [string, string],
  z.infer<typeof PostReplyFeedDataSchema>,
  PostNotFoundError | PostUserNotMemberError
>(
  (postId: string, userId: string) =>
    Effect.runPromise(fetchReplyFeedDataEffect(postId, userId)),
  PostReplyFeedDataSchema
);

export const createPost = safeWrapper<
  [CreatePostInput, string],
  z.infer<typeof PostSchema>,
  PostCreationError | PostUserNotMemberError
>(async (postData: CreatePostInput, userId: string) => {
  const result = await Effect.runPromise(createPostEffect(postData, userId));

  // Send real-time invalidation (fire-and-forget)
  import('./realtime-invalidation')
    .then(({ invalidatePostQueries }) => {
      invalidatePostQueries(postData.eventId, result.id, 'post.created', {
        postId: result.id,
        title: postData.title,
        authorId: userId,
      });
    })
    .catch(() => {
      // Silently handle invalidation errors
    });

  return result;
}, PostSchema);

export const updatePost = safeWrapper<
  [UpdatePostInput, string],
  z.infer<typeof PostSchema>,
  | PostNotFoundError
  | PostUserNotMemberError
  | PostUnauthorizedError
  | PostUpdateError
>(async (postData: UpdatePostInput, userId: string) => {
  const result = await Effect.runPromise(updatePostEffect(postData, userId));

  // Send real-time invalidation (fire-and-forget)
  import('./realtime-invalidation')
    .then(({ invalidatePostQueries }) => {
      invalidatePostQueries(result.eventId, result.id, 'post.updated', {
        postId: result.id,
        title: postData.title,
        authorId: userId,
      });
    })
    .catch(() => {
      // Silently handle invalidation errors
    });

  return result;
}, PostSchema);

export const deletePost = safeWrapper<
  [string, string],
  z.infer<typeof OperationSuccessSchema>,
  PostNotFoundError | PostUserNotMemberError | PostUnauthorizedError
>(async (postId: string, userId: string) => {
  // Get eventId before deletion for invalidation
  const postToDelete = await db.post.findUnique({
    where: { id: postId },
    select: { eventId: true },
  });

  const result = await Effect.runPromise(deletePostEffect(postId, userId));

  // Send real-time invalidation (fire-and-forget)
  if (postToDelete?.eventId) {
    import('./realtime-invalidation')
      .then(({ invalidatePostQueries }) => {
        invalidatePostQueries(postToDelete.eventId, postId, 'post.deleted', {
          postId,
          authorId: userId,
        });
      })
      .catch(() => {
        // Silently handle invalidation errors
      });
  }

  return result;
}, OperationSuccessSchema);

// Backward compatibility aliases
export const fetchPostData = fetchPostPageData;
