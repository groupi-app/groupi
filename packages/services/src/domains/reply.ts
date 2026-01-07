import { Effect, Schedule } from 'effect';
import { getUserId } from './auth-helpers';
import { db } from '../infrastructure/db';
import {
  GetRepliesByPostParams,
  CreateReplyParams,
  UpdateReplyParams,
  DeleteReplyParams,
} from '@groupi/schema/params';
import { ReplyData, OperationResult } from '@groupi/schema/data';
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
import {
  createMentionNotifications,
  createTargetedNotification,
} from './notification';
import { extractMentionedPersonIds } from '../shared/mention-utils';
import type { ResultTuple } from '@groupi/schema';
import { createEffectLoggerLayer } from '../infrastructure/logger';

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
          user: {
            name: string | null;
            email: string;
            image: string | null;
          };
        };
      }>;
      nextCursor?: string;
    }
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
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
      yield* Effect.fail(
        new NotFoundError({ message: `Post not found`, cause: postId })
      );
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
      yield* Effect.fail(
        new UnauthorizedError({ message: 'Not a member of this event' })
      );
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
          author: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
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
            yield* Effect.logDebug('Post not found for replies', {
              userId,
              postId,
              operation: 'getRepliesByPost',
            });
            return [err, undefined] as const;
          case 'UnauthorizedError':
            yield* Effect.logDebug('User not authorized to view replies', {
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
              new DatabaseError({ message: 'Failed to fetch replies' }),
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
                user: {
                  name: string | null;
                  email: string;
                  image: string | null;
                };
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
    ReplyData
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const { postId, content } = replyData;

  // Store post author ID outside Effect for use in notification creation
  let postAuthorId: string | null = null;

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
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    if (!post) {
      yield* Effect.fail(new DatabaseError({ message: 'Post not found' }));
      return;
    }

    // Store post author ID for notification creation
    postAuthorId = post.authorId;

    // Check if user is a member (business logic - no retry)
    const userMembership = post.event.memberships.find(
      membership => membership.personId === userId
    );

    if (!userMembership) {
      yield* Effect.fail(
        new UnauthorizedError({ message: 'You are not a member of this event' })
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
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
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
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    // Direct construction - matches ReplyData schema
    const validatedResult: ReplyData = {
      id: reply.id,
      text: reply.text,
      authorId: reply.authorId,
      postId: reply.postId,
      createdAt: reply.createdAt,
      updatedAt: reply.updatedAt,
    };

    yield* Effect.logInfo('Reply created successfully', {
      userId, // Who performed the action
      authorId: userId, // Who authored the reply
      replyId: reply.id,
      postId,
      operation: 'create',
    });

    return { validatedResult, eventId: post.event.id };
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        // Log expected errors at info level
        if (err instanceof UnauthorizedError) {
          yield* Effect.logDebug('User not authorized to create reply', {
            userId,
            postId,
            reason: 'not_authorized_or_not_member',
            operation: 'createReply',
          });
          return [err, undefined] as const;
        }

        // For unexpected errors, return DatabaseError
        return [
          new DatabaseError({ message: 'Failed to create reply' }),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(
      result =>
        [null, result] as [
          null,
          { validatedResult: ReplyData; eventId: string },
        ]
    )
  );

  const result = await Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('replies'))
  );

  // Trigger NEW_REPLY notification for post author only (if not the reply author)
  // Run after main Effect completes to avoid blocking or causing issues
  if (
    !result[0] &&
    result[1] &&
    postAuthorId &&
    postAuthorId !== result[1].validatedResult.authorId
  ) {
    Effect.runPromise(
      createTargetedNotification({
        personId: postAuthorId,
        eventId: result[1].eventId,
        type: 'NEW_REPLY',
        authorId: result[1].validatedResult.authorId,
        postId: replyData.postId,
      }).pipe(
        Effect.tapError(error =>
          Effect.logWarning('Failed to create NEW_REPLY notification', {
            eventId: result[1].eventId,
            postId: replyData.postId,
            replyId: result[1].validatedResult.id,
            replyAuthorId: result[1].validatedResult.authorId,
            postAuthorId: postAuthorId,
            error: error.message,
            errorType: error.constructor.name,
          })
        ),
        Effect.catchAll(() =>
          Effect.succeed({ message: 'Notification failed' })
        )
      )
    ).catch(() => {
      // Ignore errors - fire-and-forget
    });
  }

  // Extract mentions and create mention notifications (fire-and-forget)
  // This should run regardless of NEW_REPLY notification status
  if (!result[0] && result[1]) {
    try {
      const mentionedPersonIds = extractMentionedPersonIds(replyData.content);
      if (mentionedPersonIds.length > 0) {
        Effect.runPromise(
          createMentionNotifications({
            personIds: mentionedPersonIds,
            authorId: result[1].validatedResult.authorId,
            eventId: result[1].eventId,
            postId: replyData.postId,
          }).pipe(
            Effect.tapError(error =>
              Effect.logWarning(
                'Failed to create mention notifications for reply',
                {
                  eventId: result[1].eventId,
                  postId: replyData.postId,
                  replyId: result[1].validatedResult.id,
                  authorId: result[1].validatedResult.authorId,
                  mentionCount: mentionedPersonIds.length,
                  error: error.message,
                  errorType: error.constructor.name,
                }
              )
            ),
            Effect.catchAll(() =>
              Effect.succeed({ message: 'Mention notifications failed' })
            )
          )
        ).catch(() => {
          // Ignore errors - fire-and-forget
        });
      }
    } catch (err) {
      // Ignore mention extraction errors - don't block reply creation
      Effect.runPromise(
        Effect.logWarning('Failed to extract mentions from reply', {
          replyId: result[1].validatedResult.id,
          error: err instanceof Error ? err.message : String(err),
        })
      ).catch(() => {
        // Ignore logging errors
      });
    }
  }

  // Return only the validatedResult, not the eventId
  if (result[0]) {
    return [result[0], undefined] as const;
  }
  if (!result[1] || !result[1].validatedResult) {
    return [
      new DatabaseError({ message: 'Failed to create reply' }),
      undefined,
    ] as const;
  }
  return [null, result[1].validatedResult] as const;
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
    ReplyData & { postId: string }
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const { replyId, content } = replyData;

  // Store reply data outside Effect for use in mention detection
  let oldContentForMentions: string | null = null;
  let replyDataForMentions: {
    authorId: string;
    post: { eventId: string };
  } | null = null;

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Updating reply', {
      replyId,
      userId,
    });

    // Fetch reply with post and author
    const reply = yield* Effect.promise(() =>
      db.reply.findUnique({
        where: { id: replyId },
        include: {
          post: true,
          author: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  email: true,
                  image: true,
                  username: true,
                },
              },
            },
          },
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
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    if (!reply) {
      yield* Effect.fail(
        new NotFoundError({ message: `Reply not found`, cause: replyId })
      );
      return;
    }

    // Check authorization (business logic - no retry)
    if (reply.authorId !== userId) {
      yield* Effect.fail(
        new UnauthorizedError({ message: 'User not authorized' })
      );
      return;
    }

    // Store old content and reply data for mention comparison
    oldContentForMentions = reply.text;
    replyDataForMentions = {
      authorId: reply.authorId,
      post: { eventId: reply.post.eventId },
    };

    const updatedReply = yield* Effect.promise(() =>
      db.reply.update({
        where: { id: replyId },
        data: {
          text: content,
          updatedAt: new Date(),
        },
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
        Effect.logError('Database operation encountered error', {
          operation: 'updateReply.updateReply',
          replyId: replyData.replyId,
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    // Direct construction - matches ReplyData schema with postId
    const result: ReplyData & { postId: string } = {
      id: updatedReply.id,
      text: updatedReply.text,
      authorId: updatedReply.authorId,
      postId: updatedReply.postId,
      createdAt: updatedReply.createdAt,
      updatedAt: updatedReply.updatedAt,
    };

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
          yield* Effect.logDebug('Reply not found for update', {
            userId,
            replyId,
            operation: 'updateReply',
          });
          return [err, undefined] as const;
        }

        if (err instanceof UnauthorizedError) {
          yield* Effect.logDebug('User not authorized to update reply', {
            userId,
            replyId,
            reason: 'insufficient_permissions',
            operation: 'updateReply',
          });
          return [err, undefined] as const;
        }

        if (err instanceof DatabaseError) {
          yield* Effect.logDebug('Failed to update reply', {
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
          new DatabaseError({ message: 'Failed to update reply' }),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(
      result => [null, result] as [null, ReplyData & { postId: string }]
    )
  );

  const result = await Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('replies'))
  );

  // Extract mentions from new content and compare with old content
  // Only notify for newly added mentions (fire-and-forget)
  if (
    !result[0] &&
    result[1] &&
    replyDataForMentions &&
    oldContentForMentions
  ) {
    try {
      // Capture for type narrowing - use non-null assertion since we've checked above
      const mentionData: { authorId: string; post: { eventId: string } } =
        replyDataForMentions;
      const newMentionedPersonIds = extractMentionedPersonIds(
        replyData.content
      );
      const oldMentionedPersonIds = extractMentionedPersonIds(
        oldContentForMentions
      );

      // Find newly added mentions (in new but not in old)
      const newMentions = newMentionedPersonIds.filter(
        id => !oldMentionedPersonIds.includes(id)
      );

      if (newMentions.length > 0) {
        Effect.runPromise(
          createMentionNotifications({
            personIds: newMentions,
            authorId: mentionData.authorId,
            eventId: mentionData.post.eventId,
            postId: result[1].postId,
          }).pipe(
            Effect.tapError(error =>
              Effect.logWarning(
                'Failed to create mention notifications for reply update',
                {
                  eventId: mentionData.post.eventId,
                  postId: result[1].postId,
                  replyId: replyData.replyId,
                  authorId: mentionData.authorId,
                  newMentionCount: newMentions.length,
                  error: error.message,
                  errorType: error.constructor.name,
                }
              )
            ),
            Effect.catchAll(() =>
              Effect.succeed({ message: 'Mention notifications failed' })
            )
          )
        ).catch(() => {
          // Ignore errors - fire-and-forget
        });
      }
    } catch (err) {
      // Ignore mention extraction errors - don't block reply update
      Effect.runPromise(
        Effect.logWarning('Failed to extract mentions from updated reply', {
          replyId: replyData.replyId,
          error: err instanceof Error ? err.message : String(err),
        })
      ).catch(() => {
        // Ignore logging errors
      });
    }
  }

  return result;
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
    OperationResult & { postId: string }
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
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
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    if (!reply) {
      yield* Effect.fail(
        new NotFoundError({ message: `Reply not found`, cause: replyId })
      );
      return;
    }

    // Check authorization (business logic - no retry)
    const currentUserMembership = reply.post.event.memberships.find(
      membership => membership.personId === userId
    );

    if (!currentUserMembership) {
      yield* Effect.fail(
        new UnauthorizedError({ message: 'You are not a member of this event' })
      );
      return;
    }

    if (
      reply.authorId !== userId &&
      currentUserMembership.role === 'ATTENDEE'
    ) {
      yield* Effect.fail(
        new UnauthorizedError({ message: 'User not authorized' })
      );
      return;
    }

    // Store postId before deletion
    const postId = reply.post.id;

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
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    const result = { message: 'Reply deleted', postId };

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
          yield* Effect.logDebug('Reply not found for deletion', {
            userId,
            replyId,
            operation: 'deleteReply',
          });
          return [err, undefined] as const;
        }

        if (err instanceof UnauthorizedError) {
          yield* Effect.logDebug('User not authorized to delete reply', {
            userId,
            replyId,
            operation: 'deleteReply',
          });
          return [err, undefined] as const;
        }

        if (err instanceof DatabaseError) {
          yield* Effect.logDebug('Failed to delete reply', {
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
          new OperationError({ message: 'Failed to delete reply' }),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(
      result => [null, result] as [null, OperationResult & { postId: string }]
    )
  );

  // Run the effect and return the result tuple
  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('replies'))
  );
};
