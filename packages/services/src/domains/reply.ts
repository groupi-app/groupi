import { Effect, Schedule } from 'effect';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '../infrastructure/db';
import {
  GetRepliesByPostParams,
  CreateReplyParams,
  UpdateReplyParams,
  DeleteReplyParams,
} from '@groupi/schema/params';
import {
  NotFoundError,
  UnauthorizedError,
  DatabaseError,
  ConnectionError,
  ConstraintError,
  ValidationError,
  OperationError,
  AuthenticationError,
} from '@groupi/schema';
import { getPrismaError } from '../shared/errors';
import { createEventNotifications } from './notification';
import { OperationSuccessSchema } from '../shared/operations';
import type { ResultTuple } from '@groupi/schema';
import { createEffectLoggerLayer } from '../infrastructure/logger';

// Import centralized domain errors

// ============================================================================
// ZOD SCHEMAS FOR RETURN TYPES
// ============================================================================

// Schema for created replies
export const CreatedReplySchema = z.object({
  id: z.string(),
  text: z.string(),
  authorId: z.string(),
  postId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// PUBLIC API FUNCTIONS WITH RESULT TUPLE PATTERN
// ============================================================================

/**
 * Get replies for a post with pagination
 */
export const getRepliesByPost = async ({
  postId,
  cursor,
  limit = 50,
}: GetRepliesByPostParams): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | DatabaseError
    | ConnectionError
    | AuthenticationError,
    {
      items: Array<{
        id: string;
        text: string;
        authorId: string;
        postId: string;
        createdAt: Date;
        updatedAt: Date;
        author: {
          id: string;
          firstName: string | null;
          lastName: string | null;
          username: string;
          imageUrl: string;
        };
      }>;
      nextCursor?: string;
    }
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const { userId } = await auth();
  if (!userId) {
    return [new AuthenticationError('Not authenticated'), undefined] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Fetching replies for post', {
      postId,
      userId,
      cursor,
      limit,
    });

    // Check if user can access this post
    const post = yield* Effect.promise(() =>
      db.post.findUnique({
        where: { id: postId },
        select: { eventId: true },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Post', cause)),
      Effect.tapError(error =>
        error instanceof ConnectionError
          ? Effect.logWarning('Database connection issue encountered', {
              operation: 'getRepliesByPost.fetchPost',
              postId,
              userId,
              error: error.message,
              errorType: error.constructor.name,
              willRetry: true,
            })
          : Effect.void
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    if (!post) {
      yield* Effect.fail(new NotFoundError(`Post not found`, postId));
      return;
    }

    // Check if user is a member of the event
    const membership = yield* Effect.promise(() =>
      db.membership.findFirst({
        where: { eventId: post.eventId, personId: userId },
        select: { id: true },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Membership', cause)),
      Effect.tapError(error =>
        error instanceof ConnectionError
          ? Effect.logWarning('Database connection issue encountered', {
              operation: 'getRepliesByPost.checkMembership',
              postId,
              userId,
              eventId: post.eventId,
              error: error.message,
              errorType: error.constructor.name,
              willRetry: true,
            })
          : Effect.void
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    if (!membership) {
      yield* Effect.fail(new UnauthorizedError('Not a member of this event'));
      return;
    }

    // Get replies
    const replies = yield* Effect.promise(() =>
      db.reply.findMany({
        where: { postId },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        select: {
          id: true,
          text: true,
          authorId: true,
          postId: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Reply', cause)),
      Effect.tapError(error =>
        error instanceof ConnectionError
          ? Effect.logWarning('Database connection issue encountered', {
              operation: 'getRepliesByPost.fetchReplies',
              postId,
              userId,
              error: error.message,
              errorType: error.constructor.name,
              willRetry: true,
            })
          : Effect.void
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    const nextCursor =
      replies.length === limit ? replies[replies.length - 1].id : undefined;
    const result = { items: replies, nextCursor };

    yield* Effect.logDebug('Replies fetched successfully', {
      postId,
      userId,
      replyCount: replies.length,
      hasNextCursor: !!nextCursor,
    });

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        switch (err.constructor.name) {
          case 'NotFoundError':
            yield* Effect.logInfo('Post not found for replies', {
              userId,
              postId,
              operation: 'getRepliesByPost',
            });
            return [err, undefined] as const;
          case 'UnauthorizedError':
            yield* Effect.logInfo('User not authorized to view replies', {
              userId,
              postId,
              reason: 'not_member_of_event',
              operation: 'getRepliesByPost',
            });
            return [err, undefined] as const;
          case 'ConnectionError':
            yield* Effect.logError('Connection error fetching replies', {
              userId,
              postId,
              operation: 'getRepliesByPost',
            });
            return [err, undefined] as const;
          case 'DatabaseError':
            yield* Effect.logError('Database error fetching replies', {
              userId,
              postId,
              operation: 'getRepliesByPost',
            });
            return [err, undefined] as const;
          default:
            yield* Effect.logError('Unexpected error fetching replies', {
              userId,
              postId,
              operation: 'getRepliesByPost',
              errorType: err.constructor.name,
            });
            return [
              new DatabaseError('Failed to fetch replies'),
              undefined,
            ] as const;
        }
      });
    }),
    Effect.map(
      result =>
        [null, result] as [
          null,
          {
            items: Array<{
              id: string;
              text: string;
              authorId: string;
              postId: string;
              createdAt: Date;
              updatedAt: Date;
              author: {
                id: string;
                firstName: string | null;
                lastName: string | null;
                username: string;
                imageUrl: string;
              };
            }>;
            nextCursor?: string;
          },
        ]
    )
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('replies'))
  );
};

export const createReply = async (
  replyData: CreateReplyParams
): Promise<
  ResultTuple<
    UnauthorizedError | DatabaseError | AuthenticationError,
    z.infer<typeof CreatedReplySchema>
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const { userId } = await auth();
  if (!userId) {
    return [new AuthenticationError('Not authenticated'), undefined] as const;
  }

  const { postId, content } = replyData;
  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Creating reply', {
      postId,
      authorId: userId,
      userId,
    });

    // Fetch post with event and memberships
    const post = yield* Effect.promise(() =>
      db.post.findUnique({
        where: { id: postId },
        include: {
          event: {
            include: {
              memberships: true,
            },
          },
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Post', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'createReply.fetchPost',
          postId: replyData.postId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof DatabaseError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof DatabaseError,
      })
    );

    if (!post) {
      yield* Effect.fail(new DatabaseError('Post not found'));
      return;
    }

    // Check if user is a member (business logic - no retry)
    const userMembership = post.event.memberships.find(
      membership => membership.personId === userId
    );

    if (!userMembership) {
      yield* Effect.fail(
        new UnauthorizedError('You are not a member of this event')
      );
      return;
    }

    // Create the reply
    const reply = yield* Effect.promise(() =>
      db.reply.create({
        data: {
          text: content,
          postId,
          authorId: userId,
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Reply', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'createReply.createReply',
          postId: replyData.postId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof DatabaseError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof DatabaseError,
      })
    );

    // Update post and event timestamps
    yield* Effect.promise(() =>
      db.post.update({
        where: { id: replyData.postId },
        data: {
          updatedAt: new Date(),
          event: {
            update: {
              updatedAt: new Date(),
            },
          },
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Post', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'createReply.updatePost',
          postId: replyData.postId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof DatabaseError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof DatabaseError,
      })
    );

    // Validate result against schema
    const validatedResult = CreatedReplySchema.parse(reply);

    yield* Effect.logInfo('Reply created successfully', {
      userId, // Who performed the action
      authorId: userId, // Who authored the reply
      replyId: reply.id,
      postId,
      operation: 'create',
    });

    // Trigger NEW_REPLY notification for event members (fire-and-forget)
    // Get eventId from the post data we fetched earlier
    const eventId = post.event.id;
    yield* Effect.fork(
      createEventNotifications({
        eventId,
        type: 'NEW_REPLY',
        authorId: userId,
        postId,
      }).pipe(
        Effect.tapError(error =>
          Effect.logWarning('Failed to create NEW_REPLY notifications', {
            eventId,
            postId,
            replyId: reply.id,
            authorId: userId,
            error: error.message,
            errorType: error.constructor.name,
          })
        ),
        Effect.catchAll(() =>
          Effect.succeed({ message: 'Notifications failed' })
        )
      )
    );

    return validatedResult;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        // Log expected errors at info level
        if (err instanceof UnauthorizedError) {
          yield* Effect.logInfo('User not authorized to create reply', {
            userId,
            postId,
            reason: 'not_authorized_or_not_member',
            operation: 'createReply',
          });
          return [err, undefined] as const;
        }

        // For unexpected errors, return DatabaseError
        return [
          new DatabaseError('Failed to create reply'),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(
      result => [null, result] as [null, z.infer<typeof CreatedReplySchema>]
    )
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('replies'))
  );
};

export const updateReply = async (
  replyData: UpdateReplyParams
): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | DatabaseError
    | ConnectionError
    | ConstraintError
    | ValidationError
    | AuthenticationError,
    z.infer<typeof OperationSuccessSchema>
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const { userId } = await auth();
  if (!userId) {
    return [new AuthenticationError('Not authenticated'), undefined] as const;
  }

  const { replyId, content } = replyData;
  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Updating reply', {
      replyId,
      userId,
    });

    // Fetch reply with post
    const reply = yield* Effect.promise(() =>
      db.reply.findUnique({
        where: { id: replyId },
        include: {
          post: true,
        },
      })
    ).pipe(
      Effect.mapError(cause => new DatabaseError(cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'updateReply.fetchReply',
          replyId: replyData.replyId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof DatabaseError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof DatabaseError,
      })
    );

    if (!reply) {
      yield* Effect.fail(new NotFoundError(`Reply not found`, replyId));
      return;
    }

    // Check authorization (business logic - no retry)
    if (reply.authorId !== userId) {
      yield* Effect.fail(new UnauthorizedError('User not authorized'));
      return;
    }

    yield* Effect.promise(() =>
      db.reply.update({
        where: { id: replyId },
        data: { text: content },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Reply', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'updateReply.updateReply',
          replyId: replyData.replyId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof DatabaseError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof DatabaseError,
      })
    );

    const result = { message: 'Reply updated' };

    yield* Effect.logInfo('Reply updated successfully', {
      userId, // Who performed the action
      replyId: replyData.replyId,
      operation: 'update',
    });

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        // Log expected errors at info level
        if (err instanceof NotFoundError) {
          yield* Effect.logInfo('Reply not found for update', {
            userId,
            replyId,
            operation: 'updateReply',
          });
          return [err, undefined] as const;
        }

        if (err instanceof UnauthorizedError) {
          yield* Effect.logInfo('User not authorized to update reply', {
            userId,
            replyId,
            reason: 'insufficient_permissions',
            operation: 'updateReply',
          });
          return [err, undefined] as const;
        }

        if (err instanceof DatabaseError) {
          yield* Effect.logInfo('Failed to update reply', {
            userId,
            replyId,
            operation: 'updateReply',
          });
          return [err, undefined] as const;
        }

        // For unexpected errors, return ReplyUpdateError
        yield* Effect.logError('Failed to update reply: Unknown error', {
          userId,
          replyId: replyData.replyId,
          operation: 'updateReply',
        });
        return [
          new DatabaseError('Failed to update reply'),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(
      result => [null, result] as [null, z.infer<typeof OperationSuccessSchema>]
    )
  );

  // Run the effect and return the result tuple
  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('replies'))
  );
};

export const deleteReply = async ({
  replyId,
}: DeleteReplyParams): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | DatabaseError
    | ConnectionError
    | ConstraintError
    | OperationError
    | AuthenticationError,
    z.infer<typeof OperationSuccessSchema>
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const { userId } = await auth();
  if (!userId) {
    return [new AuthenticationError('Not authenticated'), undefined] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Deleting reply', {
      replyId,
      userId,
    });
    // Fetch reply with post, event, and memberships
    const reply = yield* Effect.promise(() =>
      db.reply.findUnique({
        where: { id: replyId },
        include: {
          post: {
            include: {
              event: {
                include: {
                  memberships: true,
                },
              },
            },
          },
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Reply', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'deleteReply.fetchReply',
          replyId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof DatabaseError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof DatabaseError,
      })
    );

    if (!reply) {
      yield* Effect.fail(new NotFoundError(`Reply not found`, replyId));
      return;
    }

    // Check authorization (business logic - no retry)
    const currentUserMembership = reply.post.event.memberships.find(
      membership => membership.personId === userId
    );

    if (!currentUserMembership) {
      yield* Effect.fail(
        new UnauthorizedError('You are not a member of this event')
      );
      return;
    }

    if (
      reply.authorId !== userId &&
      currentUserMembership.role === 'ATTENDEE'
    ) {
      yield* Effect.fail(new UnauthorizedError('User not authorized'));
      return;
    }

    yield* Effect.promise(() =>
      db.reply.delete({
        where: { id: replyId },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Reply', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'deleteReply.deleteReply',
          replyId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof DatabaseError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof DatabaseError,
      })
    );

    const result = { message: 'Reply deleted' };

    yield* Effect.logInfo('Reply deleted successfully', {
      userId, // Who performed the action
      replyId,
      operation: 'delete',
    });

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        // Log expected errors at info level
        if (err instanceof NotFoundError) {
          yield* Effect.logInfo('Reply not found for deletion', {
            userId,
            replyId,
            operation: 'deleteReply',
          });
          return [err, undefined] as const;
        }

        if (err instanceof UnauthorizedError) {
          yield* Effect.logInfo('User not authorized to delete reply', {
            userId,
            replyId,
            operation: 'deleteReply',
          });
          return [err, undefined] as const;
        }

        if (err instanceof DatabaseError) {
          yield* Effect.logInfo('Failed to delete reply', {
            userId,
            replyId,
            operation: 'deleteReply',
          });
          return [err, undefined] as const;
        }

        // For unexpected errors, return ReplyDeletionError
        yield* Effect.logError('Failed to delete reply: Unknown error', {
          userId,
          replyId,
          operation: 'deleteReply',
        });
        return [
          new OperationError('Failed to delete reply'),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(
      result => [null, result] as [null, z.infer<typeof OperationSuccessSchema>]
    )
  );

  // Run the effect and return the result tuple
  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('replies'))
  );
};
