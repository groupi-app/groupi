import { Effect, Schedule } from 'effect';
import { getUserId } from './auth-helpers';
import { db } from '../infrastructure/db';
import { createEffectLoggerLayer } from '../infrastructure/logger';
import type { ResultTuple } from '@groupi/schema';
import {
  GetPostFeedDataParams,
  CreatePostParams,
  GetPostDetailPageDataParams,
  UpdatePostParams,
  DeletePostParams,
} from '@groupi/schema/params';
import {
  PostData,
  PostDetailPageData,
  PostFeedData,
} from '@groupi/schema/data';
import {
  UnauthorizedError,
  DatabaseError,
  ConnectionError,
  NotFoundError,
  ConstraintError,
  ValidationError,
  AuthenticationError,
} from '@groupi/schema';
import { getPrismaError } from '../shared/errors';
import {
  createEventNotifications,
  createMentionNotifications,
} from './notification';
import { extractMentionedPersonIds } from '../shared/mention-utils';
// No more manual reporting imports needed!

// ============================================================================
// POST DOMAIN SERVICES
// ============================================================================

/**
 * Get posts for an event with pagination
 */
export const getPostFeedData = async ({
  eventId,
  cursor,
  limit = 20,
}: GetPostFeedDataParams): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | AuthenticationError
    | DatabaseError
    | ConnectionError,
    PostFeedData
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
    yield* Effect.logDebug('Fetching posts for event', {
      eventId,
      userId,
      cursor,
      limit,
    });

    // Check if user is a member
    const membership = yield* Effect.promise(() =>
      db.membership.findFirst({
        where: { eventId, personId: userId },
        select: { id: true, role: true },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Membership', cause)),
      Effect.tapError(error =>
        error instanceof ConnectionError
          ? Effect.logWarning('Database connection issue encountered', {
              operation: 'getPostsByEvent.checkMembership',
              eventId,
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

    if (!membership) {
      yield* Effect.logDebug('User not authorized to view posts', {
        userId,
        eventId,
        reason: 'not_member_of_event',
        operation: 'getPostsByEvent',
        // Debug: Check if event exists and if user has any memberships
        debug: {
          eventExists: 'checking...',
          userMemberships: 'checking...',
        },
      });
      yield* Effect.fail(
        new UnauthorizedError({ message: 'Not a member of this event' })
      );
      return;
    }

    // Fetch event base and memberships for card permissions
    const eventData = yield* Effect.promise(() =>
      db.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          chosenDateTime: true,
          memberships: {
            select: {
              id: true,
              eventId: true,
              personId: true,
              role: true,
              rsvpStatus: true,
              person: {
                select: {
                  id: true,
                  createdAt: true,
                  updatedAt: true,
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
          },
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Event', cause)),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    // Get posts with author and reply counts
    const posts = yield* Effect.promise(() =>
      db.post.findMany({
        where: { eventId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        select: {
          id: true,
          title: true,
          content: true,
          authorId: true,
          eventId: true,
          createdAt: true,
          updatedAt: true,
          editedAt: true,
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
          replies: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              text: true,
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
                      username: true,
                    },
                  },
                },
              },
            },
          },
          _count: { select: { replies: true } },
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Post', cause)),
      Effect.tapError(error =>
        error instanceof ConnectionError
          ? Effect.logWarning('Database connection issue encountered', {
              operation: 'getPostsByEvent.fetchPosts',
              eventId,
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

    const result: PostFeedData = {
      event: {
        id: eventData?.id ?? eventId,
        chosenDateTime: eventData?.chosenDateTime ?? null,
        memberships: eventData?.memberships ?? [],
        posts: posts.map(p => ({
          id: p.id,
          title: p.title,
          content: p.content,
          authorId: p.authorId,
          eventId: p.eventId,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          editedAt: p.editedAt,
          author: {
            id: p.author.id,
            user: {
              name: p.author.user?.name || null,
              email: p.author.user?.email || '',
              image: p.author.user?.image || null,
              username: p.author.user?.username || null,
            },
          },
          replies: p.replies
            .filter(r => r.author !== null)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 3)
            .map(r => ({
              id: r.id,
              createdAt: r.createdAt,
              updatedAt: r.updatedAt,
              author: {
                id: r.author!.id,
                user: {
                  name: r.author!.user?.name || null,
                  email: r.author!.user?.email || '',
                  image: r.author!.user?.image || null,
                  username: r.author!.user?.username || null,
                },
              },
            })),
          replyCount: p._count.replies,
        })),
      },
      userMembership: {
        id: membership.id,
        role: membership.role,
      },
    };

    yield* Effect.logDebug('Posts fetched successfully', {
      eventId,
      userId,
      postCount: posts.length,
    });

    return result;
  }).pipe(
    Effect.either,
    Effect.map(either =>
      either._tag === 'Left'
        ? ([
            either.left instanceof UnauthorizedError ||
            either.left instanceof ConnectionError ||
            either.left instanceof DatabaseError
              ? either.left
              : new DatabaseError({
                  message: 'Failed to fetch posts',
                  cause: either.left,
                }),
            undefined,
          ] as [DatabaseError | UnauthorizedError | ConnectionError, undefined])
        : ([null, either.right] as [null, PostFeedData])
    )
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('posts'))
  );
};

/**
 * Fetch post detail page data (post + replies + permissions)
 * Retries on database errors
 */
export const fetchPostDetailPageData = async ({
  postId,
}: GetPostDetailPageDataParams): Promise<
  ResultTuple<
    | NotFoundError
    | DatabaseError
    | UnauthorizedError
    | AuthenticationError
    | ConnectionError,
    PostDetailPageData
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
    yield* Effect.logDebug('Fetching post detail page data', {
      postId,
      userId,
    });
    const postData = yield* Effect.promise(() =>
      // Get post data
      db.post.findUnique({
        where: { id: postId },
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          editedAt: true,
          authorId: true,
          eventId: true,
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
          event: {
            select: {
              id: true,
              title: true,
              chosenDateTime: true,
              memberships: {
                select: {
                  id: true,
                  role: true,
                  rsvpStatus: true,
                  personId: true,
                  eventId: true,
                  person: {
                    select: {
                      id: true,
                      createdAt: true,
                      updatedAt: true,
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
              },
            },
          },
          replies: {
            select: {
              id: true,
              text: true,
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
                      username: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      })
    ).pipe(
      // Map error to DatabaseError
      Effect.mapError((cause: Error) => getPrismaError('Post', cause)),
      // Log warning if database connection issue encountered
      Effect.tapError(error =>
        error instanceof ConnectionError
          ? Effect.logWarning('Database connection issue encountered', {
              operation: 'fetchPostDetailPageData',
              postId,
              userId,
              error: error.message,
              errorType: error.constructor.name,
              willRetry: true,
            })
          : Effect.void
      ),
      // Retry on ConnectionError with exponential backoff
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );
    // If post not found, return error
    if (!postData) {
      yield* Effect.logDebug('Post not found', {
        userId,
        postId,
        operation: 'fetchPostDetailPageData',
      });
      yield* Effect.fail(
        new NotFoundError({ message: `Post not found`, cause: postId })
      );
      return;
    }

    // Find user's membership
    const userMembership = postData.event.memberships.find(
      membership => membership.personId === userId
    );

    // If user is not a member of the event, return error
    if (!userMembership) {
      yield* Effect.logDebug('User not authorized to view post', {
        userId,
        postId,
        reason: 'not_member_of_event',
        operation: 'fetchPostDetailPageData',
      });
      yield* Effect.fail(
        new UnauthorizedError({ message: 'Not authorized to view this post' })
      );
      return;
    }

    // Construct result
    const result: PostDetailPageData = {
      post: {
        id: postData.id,
        title: postData.title,
        content: postData.content,
        authorId: postData.authorId,
        eventId: postData.eventId,
        createdAt: postData.createdAt,
        updatedAt: postData.updatedAt,
        editedAt: postData.editedAt,
        author: {
          id: postData.author.id,
          user: {
            name: postData.author.user?.name || null,
            email: postData.author.user?.email || '',
            image: postData.author.user?.image || null,
            username: postData.author.user?.username || null,
          },
        },
        replies: postData.replies
          .filter(reply => reply.author !== null)
          .map(reply => ({
            id: reply.id,
            text: reply.text,
            createdAt: reply.createdAt,
            updatedAt: reply.updatedAt,
            author: {
              id: reply.author!.id,
              user: {
                name: reply.author!.user?.name || null,
                email: reply.author!.user?.email || '',
                image: reply.author!.user?.image || null,
                username: reply.author!.user?.username || null,
              },
            },
          })),
        event: {
          id: postData.event.id,
          title: postData.event.title,
          chosenDateTime: postData.event.chosenDateTime,
          memberships: postData.event.memberships.map(m => ({
            id: m.id,
            role: m.role,
            rsvpStatus: m.rsvpStatus,
            personId: m.personId,
            eventId: m.eventId,
            person: {
              id: m.person.id,
              createdAt: m.person.createdAt,
              updatedAt: m.person.updatedAt,
              user: {
                name: m.person.user?.name || null,
                email: m.person.user?.email || '',
                image: m.person.user?.image || null,
                username: m.person.user?.username || null,
              },
            },
          })),
        },
      },
      userMembership: {
        id: userMembership.id,
        role: userMembership.role,
        personId: userMembership.personId,
      },
    };
    yield* Effect.logDebug('Post detail page data fetched successfully', {
      postId,
      userId,
      result,
    });
    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        if (
          err instanceof NotFoundError ||
          err instanceof UnauthorizedError ||
          err instanceof ConnectionError ||
          err instanceof DatabaseError
        ) {
          return [err, undefined] as const;
        }
        return [
          new DatabaseError({
            message: 'Failed to fetch post detail page data',
          }),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, PostDetailPageData])
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('posts'))
  );
};

/**
 * Create a new post
 * Retries on database errors
 */
export const createPost = async (
  postData: CreatePostParams
): Promise<
  ResultTuple<
    | DatabaseError
    | UnauthorizedError
    | AuthenticationError
    | ConnectionError
    | ConstraintError
    | ValidationError,
    PostData
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

  const { eventId, title, content } = postData;
  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Creating new post', {
      eventId,
      userId,
      title,
    });

    // Check if user is a member of the event
    const membership = yield* Effect.promise(() =>
      db.membership.findFirst({
        where: {
          eventId,
          personId: userId,
        },
      })
    ).pipe(
      // Map error using our enhanced error helper
      Effect.mapError((cause: Error) => getPrismaError('Membership', cause)),
      // Log warning if database connection issue encountered
      Effect.tapError(error =>
        error instanceof ConnectionError
          ? Effect.logWarning('Database connection issue encountered', {
              operation: 'createPost.checkMembership',
              eventId,
              userId,
              error: error.message,
              errorType: error.constructor.name,
              willRetry: true,
            })
          : Effect.void
      ),
      // Retry on ConnectionError with exponential backoff
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    // If user is not a member of the event, return error
    if (!membership) {
      yield* Effect.logDebug('User not authorized to create post', {
        userId,
        eventId,
        reason: 'not_member_of_event',
        operation: 'createPost',
      });
      yield* Effect.fail(
        new UnauthorizedError({ message: 'Not a member of this event' })
      );
      return;
    }

    // Create the post
    const post = yield* Effect.promise(() =>
      db.post.create({
        data: {
          title,
          content,
          eventId,
          authorId: userId,
        },
        select: {
          id: true,
          title: true,
          content: true,
          authorId: true,
          eventId: true,
          createdAt: true,
          updatedAt: true,
          editedAt: true,
        },
      })
    ).pipe(
      // Map error using our enhanced error helper
      Effect.mapError((cause: Error) => getPrismaError('Post', cause)),
      // Log warning if database connection issue encountered
      Effect.tapError(error =>
        error instanceof ConnectionError
          ? Effect.logWarning('Database connection issue encountered', {
              operation: 'createPost.createPost',
              eventId,
              userId,
              error: error.message,
              errorType: error.constructor.name,
              willRetry: true,
            })
          : Effect.void
      ),
      // Retry on ConnectionError with exponential backoff
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    // Update event timestamp (fire-and-forget)
    Effect.runPromise(
      Effect.promise(() =>
        db.event.update({
          where: { id: postData.eventId },
          data: { updatedAt: new Date() },
        })
      ).pipe(
        Effect.tapError(() =>
          Effect.logDebug('Failed to update event timestamp', {
            eventId: postData.eventId,
            postId: post.id,
          })
        ),
        Effect.catchAll(() => Effect.succeed(void 0)) // Ignore errors
      )
    );

    // Construct result
    const result: PostData = {
      id: post.id,
      title: post.title,
      content: post.content,
      authorId: post.authorId,
      eventId: post.eventId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      editedAt: post.editedAt,
    };

    yield* Effect.logInfo('Post created successfully', {
      userId, // Who performed the action
      authorId: userId, // Who authored the post (same as userId for create)
      postId: post.id,
      eventId,
      title,
      operation: 'create',
    });

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        if (
          err instanceof UnauthorizedError ||
          err instanceof ConnectionError ||
          err instanceof ConstraintError ||
          err instanceof ValidationError ||
          err instanceof DatabaseError
        ) {
          return [err, undefined] as const;
        }
        return [
          new DatabaseError({ message: 'Failed to create post' }),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, PostData])
  );

  const result = await Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('posts'))
  );

  // Trigger NEW_POST notification for event members (fire-and-forget)
  // Run after main Effect completes to avoid blocking or causing issues
  if (!result[0] && result[1]) {
    Effect.runPromise(
      createEventNotifications({
        eventId: postData.eventId,
        type: 'NEW_POST',
        authorId: result[1].authorId,
        postId: result[1].id,
      }).pipe(
        Effect.tapError(error =>
          Effect.logWarning('Failed to create NEW_POST notifications', {
            eventId: postData.eventId,
            postId: result[1].id,
            authorId: result[1].authorId,
            error: error.message,
            errorType: error.constructor.name,
          })
        ),
        Effect.catchAll(() =>
          Effect.succeed({ message: 'Notifications failed' })
        )
      )
    ).catch(() => {
      // Ignore errors - fire-and-forget
    });

    // Extract mentions and create mention notifications (fire-and-forget)
    try {
      const mentionedPersonIds = extractMentionedPersonIds(result[1].content);
      if (mentionedPersonIds.length > 0) {
        Effect.runPromise(
          createMentionNotifications({
            personIds: mentionedPersonIds,
            authorId: result[1].authorId,
            eventId: result[1].eventId,
            postId: result[1].id,
          }).pipe(
            Effect.tapError(error =>
              Effect.logWarning('Failed to create mention notifications', {
                eventId: result[1].eventId,
                postId: result[1].id,
                authorId: result[1].authorId,
                mentionCount: mentionedPersonIds.length,
                error: error.message,
                errorType: error.constructor.name,
              })
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
      // Ignore mention extraction errors - don't block post creation
      Effect.runPromise(
        Effect.logWarning('Failed to extract mentions from post', {
          postId: result[1].id,
          error: err instanceof Error ? err.message : String(err),
        })
      ).catch(() => {
        // Ignore logging errors
      });
    }
  }

  return result;
};

/**
 * Update a post
 * Retries on database errors
 */
export const updatePost = async (
  updateData: UpdatePostParams
): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | AuthenticationError
    | DatabaseError
    | ConnectionError
    | ConstraintError
    | ValidationError,
    PostData
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

  const { id: postId, title, content } = updateData;

  // Fetch old post content for mention comparison (before the Effect)
  let oldPostContent: string | null = null;
  try {
    const oldPost = await db.post.findUnique({
      where: { id: postId },
      select: { content: true },
    });
    oldPostContent = oldPost?.content ?? null;
  } catch {
    // Ignore errors - we'll handle them in the Effect
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Updating post', {
      postId,
      userId,
      title,
    });

    // Check if post exists and user can edit it
    const existingPost = yield* Effect.promise(() =>
      db.post.findUnique({
        where: { id: postId },
        include: {
          event: {
            include: {
              memberships: {
                where: { personId: userId },
                take: 1,
              },
            },
          },
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Post', cause)),
      Effect.tapError(error =>
        error instanceof ConnectionError
          ? Effect.logWarning('Database connection issue encountered', {
              operation: 'updatePost.fetchPost',
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

    if (!existingPost) {
      yield* Effect.logDebug('Post not found for update', {
        userId,
        postId,
        operation: 'updatePost',
      });
      yield* Effect.fail(
        new NotFoundError({ message: `Post not found`, cause: postId })
      );
      return;
    }

    const userMembership = existingPost.event.memberships[0];
    if (!userMembership) {
      yield* Effect.logDebug('User not authorized to update post', {
        userId,
        postId,
        reason: 'not_member_of_event',
        operation: 'updatePost',
      });
      yield* Effect.fail(
        new UnauthorizedError({ message: 'Not a member of this event' })
      );
      return;
    }

    // Check authorization (author or organizer/moderator)
    if (
      existingPost.authorId !== userId &&
      !['ORGANIZER', 'MODERATOR'].includes(userMembership.role)
    ) {
      yield* Effect.logDebug('User not authorized to edit post', {
        userId,
        postId,
        reason: 'insufficient_permissions',
        operation: 'updatePost',
      });
      yield* Effect.fail(
        new UnauthorizedError({ message: 'Not authorized to edit this post' })
      );
      return;
    }

    const post = yield* Effect.promise(() =>
      db.post.update({
        where: { id: postId },
        data: {
          title,
          content,
          editedAt: new Date(),
        },
        select: {
          id: true,
          title: true,
          content: true,
          authorId: true,
          eventId: true,
          createdAt: true,
          updatedAt: true,
          editedAt: true,
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Post', cause)),
      Effect.tapError(error =>
        error instanceof ConnectionError
          ? Effect.logWarning('Database connection issue encountered', {
              operation: 'updatePost.updatePost',
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

    // Direct construction
    const result: PostData = {
      id: post.id,
      title: post.title,
      content: post.content,
      authorId: post.authorId,
      eventId: post.eventId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      editedAt: post.editedAt,
    };

    yield* Effect.logInfo('Post updated successfully', {
      userId, // Who performed the action
      authorId: existingPost.authorId, // Who originally authored the post
      postId: post.id,
      eventId: post.eventId,
      title: updateData.title,
      operation: 'update',
    });

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        if (err instanceof NotFoundError || err instanceof UnauthorizedError) {
          return [err, undefined] as const;
        }
        return [
          new DatabaseError({ message: 'Failed to update post' }),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(result => [null, result] as [null, PostData])
  );

  const result = await Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('posts'))
  );

  // Extract mentions from new content and compare with old content
  // Only notify for newly added mentions (fire-and-forget)
  if (!result[0] && result[1] && oldPostContent) {
    try {
      const newMentionedPersonIds = extractMentionedPersonIds(
        result[1].content
      );
      const oldMentionedPersonIds = extractMentionedPersonIds(oldPostContent);

      // Find newly added mentions (in new but not in old)
      const newMentions = newMentionedPersonIds.filter(
        id => !oldMentionedPersonIds.includes(id)
      );

      if (newMentions.length > 0) {
        Effect.runPromise(
          createMentionNotifications({
            personIds: newMentions,
            authorId: result[1].authorId,
            eventId: result[1].eventId,
            postId: result[1].id,
          }).pipe(
            Effect.tapError(error =>
              Effect.logWarning(
                'Failed to create mention notifications for post update',
                {
                  eventId: result[1].eventId,
                  postId: result[1].id,
                  authorId: result[1].authorId,
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
      // Ignore mention extraction errors - don't block post update
      Effect.runPromise(
        Effect.logWarning('Failed to extract mentions from updated post', {
          postId: result[1].id,
          error: err instanceof Error ? err.message : String(err),
        })
      ).catch(() => {
        // Ignore logging errors
      });
    }
  }

  return result;
};

/**
 * Delete a post
 * Retries on database errors
 */
export const deletePost = async ({
  postId,
}: DeletePostParams): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | AuthenticationError
    | DatabaseError
    | ConnectionError
    | ConstraintError,
    { message: string; eventId: string }
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
    yield* Effect.logDebug('Deleting post', {
      postId,
      userId,
    });

    // Check if post exists and user can delete it
    const existingPost = yield* Effect.promise(() =>
      db.post.findUnique({
        where: { id: postId },
        include: {
          event: {
            include: {
              memberships: {
                where: { personId: userId },
                take: 1,
              },
            },
          },
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Post', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'deletePost.fetchPost',
          postId,
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

    if (!existingPost) {
      yield* Effect.logDebug('Post not found for deletion', {
        userId,
        postId,
        operation: 'deletePost',
      });
      yield* Effect.fail(
        new NotFoundError({ message: `Post not found`, cause: postId })
      );
      return;
    }

    const userMembership = existingPost.event.memberships[0];
    if (!userMembership) {
      yield* Effect.logDebug('User not authorized to delete post', {
        userId,
        postId,
        reason: 'not_member_of_event',
        operation: 'deletePost',
      });
      yield* Effect.fail(
        new UnauthorizedError({ message: 'Not a member of this event' })
      );
      return;
    }

    // Check authorization (author or organizer/moderator)
    if (
      existingPost.authorId !== userId &&
      !['ORGANIZER', 'MODERATOR'].includes(userMembership.role)
    ) {
      yield* Effect.logDebug('User not authorized to delete post', {
        userId,
        postId,
        reason: 'insufficient_permissions',
        operation: 'deletePost',
      });
      yield* Effect.fail(
        new UnauthorizedError({ message: 'Not authorized to delete this post' })
      );
      return;
    }

    yield* Effect.promise(() =>
      db.post.delete({
        where: { id: postId },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Post', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'deletePost.deletePost',
          postId,
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

    const result = {
      message: 'Post deleted successfully',
      eventId: existingPost.eventId,
    };

    yield* Effect.logInfo('Post deleted successfully', {
      userId, // Who performed the action
      authorId: existingPost.authorId, // Who originally authored the post
      postId,
      eventId: existingPost.eventId,
      operation: 'delete',
    });

    return result;
  }).pipe(
    Effect.catchAll(err => {
      return Effect.gen(function* () {
        yield* Effect.void;
        if (err instanceof NotFoundError || err instanceof UnauthorizedError) {
          return [err, undefined] as const;
        }
        return [
          new DatabaseError({ message: 'Failed to delete post' }),
          undefined,
        ] as const;
      });
    }),
    // Map result to tuple
    Effect.map(
      result => [null, result] as [null, { message: string; eventId: string }]
    )
  );

  return Effect.runPromise(
    Effect.provide(effect, createEffectLoggerLayer('posts'))
  );
};
