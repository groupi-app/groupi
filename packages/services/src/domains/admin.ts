import { Effect, Schedule } from 'effect';
import { db } from '../infrastructure/db';
import { createEffectLoggerLayer } from '../infrastructure/logger';
import {
  DatabaseError,
  ConnectionError,
  UnauthorizedError,
  AuthenticationError,
} from '@groupi/schema';
import type { ResultTuple } from '@groupi/schema';
import type {
  UserAdminListItemData,
  EventAdminListItemData,
  PostAdminListItemData,
  ReplyAdminListItemData,
} from '@groupi/schema';
import { getPrismaError } from '../shared/errors';
import { getCurrentUserId } from './auth';

// ============================================================================
// ADMIN LIST OPERATIONS
// ============================================================================

/**
 * Get all users for admin dashboard
 * Requires admin authentication
 */
export const getAllUsers = async (): Promise<
  ResultTuple<
    DatabaseError | ConnectionError | AuthenticationError | UnauthorizedError,
    UserAdminListItemData[]
  >
> => {
  // Get auth and check admin status
  const [authError, userId] = await getCurrentUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Fetching all users for admin', { userId });

    // Check if user is admin
    const currentUser: { role: string | null } | null = yield* Effect.promise(
      () =>
        db.user.findUnique({
          where: { id: userId },
          select: { role: true },
        })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('User', cause)),
      Effect.tapError(error =>
        Effect.logError('Failed to check user role', {
          userId,
          error: error.message,
        })
      )
    );

    if (!currentUser || !currentUser.role?.includes('admin')) {
      return yield* Effect.fail(
        new UnauthorizedError({ message: 'Admin access required' })
      );
    }

    // Fetch all users with counts
    type UserWithCounts = {
      id: string;
      name: string | null;
      email: string;
      username: string | null;
      displayUsername: string | null;
      role: string | null;
      image: string | null;
      createdAt: Date;
      updatedAt: Date;
      person: {
        _count: {
          memberships: number;
          posts: number;
          replies: number;
        };
      } | null;
    };

    const users: UserWithCounts[] = (yield* Effect.promise(() =>
      db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          displayUsername: true,
          role: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          person: {
            select: {
              _count: {
                select: {
                  memberships: true,
                  posts: true,
                  replies: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('User', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'getAllUsers',
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
    )) as UserWithCounts[];

    // Transform to UserAdminListItemData format
    const result: UserAdminListItemData[] = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      displayUsername: user.displayUsername,
      role: user.role,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      _count: {
        memberships: user.person?._count.memberships || 0,
        posts: user.person?._count.posts || 0,
        replies: user.person?._count.replies || 0,
      },
    }));

    yield* Effect.logInfo('Successfully fetched all users', {
      count: result.length,
    });

    return result;
  });

  return Effect.runPromise(
    effect.pipe(
      Effect.provide(createEffectLoggerLayer('admin')),
      Effect.either,
      Effect.map(either =>
        either._tag === 'Left'
          ? ([
              either.left instanceof DatabaseError ||
              either.left instanceof ConnectionError ||
              either.left instanceof AuthenticationError ||
              either.left instanceof UnauthorizedError
                ? either.left
                : new DatabaseError({
                    message: either.left.message,
                    cause: either.left,
                  }),
              undefined,
            ] as const)
          : ([null, either.right] as const)
      )
    )
  );
};

/**
 * Get all events for admin dashboard with pagination
 * Requires admin authentication
 */
export const getAllEvents = async (params?: {
  cursor?: string;
  limit?: number;
  search?: string;
}): Promise<
  ResultTuple<
    DatabaseError | ConnectionError | AuthenticationError | UnauthorizedError,
    {
      items: EventAdminListItemData[];
      nextCursor: string | undefined;
      totalCount: number;
    }
  >
> => {
  const limit = params?.limit || 50;
  const search = params?.search;

  // Get auth and check admin status
  const [authError, userId] = await getCurrentUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Fetching all events for admin', {
      userId,
      cursor: params?.cursor,
      limit,
      search,
    });

    // Check if user is admin
    const currentUser: { role: string | null } | null = yield* Effect.promise(
      () =>
        db.user.findUnique({
          where: { id: userId },
          select: { role: true },
        })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('User', cause)),
      Effect.tapError(error =>
        Effect.logError('Failed to check user role', {
          userId,
          error: error.message,
        })
      )
    );

    if (!currentUser || !currentUser.role?.includes('admin')) {
      return yield* Effect.fail(
        new UnauthorizedError({ message: 'Admin access required' })
      );
    }

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            {
              description: { contains: search, mode: 'insensitive' as const },
            },
            { location: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // Get total count
    const totalCount: number = yield* Effect.promise(() =>
      db.event.count({ where })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Event', cause)),
      Effect.tapError(error =>
        Effect.logError('Failed to get event count', {
          error: error.message,
        })
      )
    );

    // Fetch events with pagination
    type EventWithOrganizer = {
      id: string;
      title: string;
      description: string;
      location: string;
      chosenDateTime: Date | null;
      createdAt: Date;
      updatedAt: Date;
      memberships: Array<{
        person: {
          user: {
            id: string;
            name: string | null;
            email: string;
          };
        };
        role: string;
      }>;
      _count: {
        memberships: number;
        posts: number;
      };
    };

    const events: EventWithOrganizer[] = (yield* Effect.promise(() =>
      db.event.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          chosenDateTime: true,
          createdAt: true,
          updatedAt: true,
          memberships: {
            where: { role: 'ORGANIZER' },
            take: 1,
            select: {
              person: {
                select: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
              role: true,
            },
          },
          _count: {
            select: {
              memberships: true,
              posts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(params?.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Event', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'getAllEvents',
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
    )) as EventWithOrganizer[];

    const hasMore = events.length > limit;
    const items = hasMore ? events.slice(0, -1) : events;
    const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

    // Transform to EventAdminListItemData format
    const result: EventAdminListItemData[] = items.map(
      (event: EventWithOrganizer) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        chosenDateTime: event.chosenDateTime,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        organizer: event.memberships[0]?.person.user
          ? {
              id: event.memberships[0].person.user.id,
              name: event.memberships[0].person.user.name,
              email: event.memberships[0].person.user.email,
            }
          : null,
        _count: {
          memberships: event._count.memberships,
          posts: event._count.posts,
        },
      })
    );

    yield* Effect.logInfo('Successfully fetched all events', {
      count: result.length,
      totalCount,
    });

    return { items: result, nextCursor, totalCount };
  });

  return Effect.runPromise(
    effect.pipe(
      Effect.provide(createEffectLoggerLayer('admin')),
      Effect.either,
      Effect.map(either =>
        either._tag === 'Left'
          ? ([
              either.left instanceof DatabaseError ||
              either.left instanceof ConnectionError ||
              either.left instanceof AuthenticationError ||
              either.left instanceof UnauthorizedError
                ? either.left
                : new DatabaseError({
                    message: either.left.message,
                    cause: either.left,
                  }),
              undefined,
            ] as const)
          : ([null, either.right] as const)
      )
    )
  );
};

/**
 * Get all posts for admin dashboard with pagination
 * Requires admin authentication
 */
export const getAllPosts = async (params?: {
  cursor?: string;
  limit?: number;
  search?: string;
}): Promise<
  ResultTuple<
    DatabaseError | ConnectionError | AuthenticationError | UnauthorizedError,
    {
      items: PostAdminListItemData[];
      nextCursor: string | undefined;
      totalCount: number;
    }
  >
> => {
  const limit = params?.limit || 50;
  const search = params?.search;

  // Get auth and check admin status
  const [authError, userId] = await getCurrentUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Fetching all posts for admin', {
      userId,
      cursor: params?.cursor,
      limit,
      search,
    });

    // Check if user is admin
    const currentUser: { role: string | null } | null = yield* Effect.promise(
      () =>
        db.user.findUnique({
          where: { id: userId },
          select: { role: true },
        })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('User', cause)),
      Effect.tapError(error =>
        Effect.logError('Failed to check user role', {
          userId,
          error: error.message,
        })
      )
    );

    if (!currentUser || !currentUser.role?.includes('admin')) {
      return yield* Effect.fail(
        new UnauthorizedError({ message: 'Admin access required' })
      );
    }

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { content: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // Get total count
    const totalCount: number = yield* Effect.promise(() =>
      db.post.count({ where })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Post', cause)),
      Effect.tapError(error =>
        Effect.logError('Failed to get post count', {
          error: error.message,
        })
      )
    );

    // Fetch posts with pagination
    type PostWithAuthor = {
      id: string;
      title: string;
      content: string;
      createdAt: Date;
      updatedAt: Date;
      editedAt: Date;
      author: {
        user: {
          id: string;
          name: string | null;
          email: string;
        };
      };
      event: {
        id: string;
        title: string;
      };
      _count: {
        replies: number;
      };
    };

    const posts: PostWithAuthor[] = (yield* Effect.promise(() =>
      db.post.findMany({
        where,
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          editedAt: true,
          author: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          event: {
            select: {
              id: true,
              title: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(params?.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Post', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'getAllPosts',
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
    )) as PostWithAuthor[];

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, -1) : posts;
    const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

    // Transform to PostAdminListItemData format
    const result: PostAdminListItemData[] = items.map(
      (post: PostWithAuthor) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        editedAt: post.editedAt,
        author: {
          id: post.author.user.id,
          name: post.author.user.name,
          email: post.author.user.email,
        },
        event: {
          id: post.event.id,
          title: post.event.title,
        },
        _count: {
          replies: post._count.replies,
        },
      })
    );

    yield* Effect.logInfo('Successfully fetched all posts', {
      count: result.length,
      totalCount,
    });

    return { items: result, nextCursor, totalCount };
  });

  return Effect.runPromise(
    effect.pipe(
      Effect.provide(createEffectLoggerLayer('admin')),
      Effect.either,
      Effect.map(either =>
        either._tag === 'Left'
          ? ([
              either.left instanceof DatabaseError ||
              either.left instanceof ConnectionError ||
              either.left instanceof AuthenticationError ||
              either.left instanceof UnauthorizedError
                ? either.left
                : new DatabaseError({
                    message: either.left.message,
                    cause: either.left,
                  }),
              undefined,
            ] as const)
          : ([null, either.right] as const)
      )
    )
  );
};

/**
 * Get all replies for admin dashboard with pagination
 * Requires admin authentication
 */
export const getAllReplies = async (params?: {
  cursor?: string;
  limit?: number;
  search?: string;
}): Promise<
  ResultTuple<
    DatabaseError | ConnectionError | AuthenticationError | UnauthorizedError,
    {
      items: ReplyAdminListItemData[];
      nextCursor: string | undefined;
      totalCount: number;
    }
  >
> => {
  const limit = params?.limit || 50;
  const search = params?.search;

  // Get auth and check admin status
  const [authError, userId] = await getCurrentUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Fetching all replies for admin', {
      userId,
      cursor: params?.cursor,
      limit,
      search,
    });

    // Check if user is admin
    const currentUser: { role: string | null } | null = yield* Effect.promise(
      () =>
        db.user.findUnique({
          where: { id: userId },
          select: { role: true },
        })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('User', cause)),
      Effect.tapError(error =>
        Effect.logError('Failed to check user role', {
          userId,
          error: error.message,
        })
      )
    );

    if (!currentUser || !currentUser.role?.includes('admin')) {
      return yield* Effect.fail(
        new UnauthorizedError({ message: 'Admin access required' })
      );
    }

    // Build where clause for search
    const where = search
      ? {
          text: { contains: search, mode: 'insensitive' as const },
        }
      : {};

    // Get total count
    const totalCount: number = yield* Effect.promise(() =>
      db.reply.count({ where })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Reply', cause)),
      Effect.tapError(error =>
        Effect.logError('Failed to get reply count', {
          error: error.message,
        })
      )
    );

    // Fetch replies with pagination
    type ReplyWithPost = {
      id: string;
      text: string;
      createdAt: Date;
      updatedAt: Date;
      author: {
        user: {
          id: string;
          name: string | null;
          email: string;
        };
      };
      post: {
        id: string;
        title: string;
        event: {
          id: string;
          title: string;
        };
      };
    };

    const replies: ReplyWithPost[] = (yield* Effect.promise(() =>
      db.reply.findMany({
        where,
        select: {
          id: true,
          text: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          post: {
            select: {
              id: true,
              title: true,
              event: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(params?.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Reply', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'getAllReplies',
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
    )) as ReplyWithPost[];

    const hasMore = replies.length > limit;
    const items = hasMore ? replies.slice(0, -1) : replies;
    const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

    // Transform to ReplyAdminListItemData format
    const result: ReplyAdminListItemData[] = items.map(
      (reply: ReplyWithPost) => ({
        id: reply.id,
        text: reply.text,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
        author: {
          id: reply.author.user.id,
          name: reply.author.user.name,
          email: reply.author.user.email,
        },
        post: {
          id: reply.post.id,
          title: reply.post.title,
          event: {
            id: reply.post.event.id,
            title: reply.post.event.title,
          },
        },
      })
    );

    yield* Effect.logInfo('Successfully fetched all replies', {
      count: result.length,
      totalCount,
    });

    return { items: result, nextCursor, totalCount };
  });

  return Effect.runPromise(
    effect.pipe(
      Effect.provide(createEffectLoggerLayer('admin')),
      Effect.either,
      Effect.map(either =>
        either._tag === 'Left'
          ? ([
              either.left instanceof DatabaseError ||
              either.left instanceof ConnectionError ||
              either.left instanceof AuthenticationError ||
              either.left instanceof UnauthorizedError
                ? either.left
                : new DatabaseError({
                    message: either.left.message,
                    cause: either.left,
                  }),
              undefined,
            ] as const)
          : ([null, either.right] as const)
      )
    )
  );
};
