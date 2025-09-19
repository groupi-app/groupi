import { Effect } from 'effect';
import { z } from 'zod';
import { db } from './db';
import { getPusherServer } from './pusher-server';
import {
  getEventQuery,
  getPersonQuery,
  getPostQuery,
} from '@groupi/schema/queries';
import { Reply, CreateReplyInput, UpdateReplyInput } from '@groupi/schema';
import { createPostNotifs } from './notification';
import { SentryHelpers } from './sentry';
import { safeWrapper } from './shared/safe-wrapper';
import { OperationSuccessSchema } from './shared/operations';

// Import shared patterns
import {
  dbOperation,
  externalServiceOperation,
} from './shared/effect-patterns';

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
// ERROR TYPES
// ============================================================================

export class ReplyNotFoundError extends Error {
  readonly _tag = 'ReplyNotFoundError';
  constructor(replyId: string) {
    super(`Reply not found: ${replyId}`);
  }
}

export class ReplyUserNotFoundError extends Error {
  readonly _tag = 'ReplyUserNotFoundError';
  constructor() {
    super('User not found');
  }
}

export class ReplyUnauthorizedError extends Error {
  readonly _tag = 'ReplyUnauthorizedError';
  constructor(message: string) {
    super(message);
  }
}

export class ReplyCreationError extends Error {
  readonly _tag = 'ReplyCreationError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to create reply');
    if (cause) {
      this.cause = cause;
    }
  }
}

export class ReplyUpdateError extends Error {
  readonly _tag = 'ReplyUpdateError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to update reply');
    if (cause) {
      this.cause = cause;
    }
  }
}

export class ReplyDeletionError extends Error {
  readonly _tag = 'ReplyDeletionError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to delete reply');
    if (cause) {
      this.cause = cause;
    }
  }
}

// ============================================================================
// EFFECT FUNCTIONS (Core Business Logic)
// ============================================================================

// Modernized Effect-based function to create reply
export const createReplyEffect = (
  replyData: CreateReplyInput,
  authorId: string,
  userId: string
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Validate user authorization (business logic - no retry)
      if (authorId !== userId) {
        return yield* _(
          Effect.fail(new ReplyUnauthorizedError('User not authorized'))
        );
      }

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
          _error => new ReplyCreationError(_error),
          `Fetch post for reply creation: ${postId}`
        )
      );

      if (!post) {
        return yield* _(Effect.fail(new ReplyCreationError('Post not found')));
      }

      // Check if user is a member (business logic - no retry)
      const userMembership = post.event.memberships.find(
        membership => membership.personId === userId
      );

      if (!userMembership) {
        return yield* _(
          Effect.fail(
            new ReplyUnauthorizedError('You are not a member of this event')
          )
        );
      }

      // Create the reply (database operation with retry)
      const reply = yield* _(
        dbOperation(
          () =>
            db.reply.create({
              data: {
                text,
                postId,
                authorId,
              },
            }),
          _error => new ReplyCreationError(_error),
          `Create reply for post: ${postId}`
        )
      );

      // Update post and event timestamps (database operation with retry)
      yield* _(
        dbOperation(
          () =>
            db.post.update({
              where: { id: postId },
              data: {
                updatedAt: new Date().toISOString(),
                event: {
                  update: {
                    updatedAt: new Date().toISOString(),
                  },
                },
              },
            }),
          _error => new ReplyCreationError(_error),
          `Update timestamps for reply creation: ${postId}`
        )
      );

      // Send pusher notifications (external service - retry with graceful degradation)
      const eventQueryDefinition = getEventQuery(post.eventId);
      const postQueryDefinition = getPostQuery(post.id);

      const events = [
        {
          channel: eventQueryDefinition.pusherChannel,
          name: eventQueryDefinition.pusherEvent,
          data: { message: 'Event data updated' },
        },
        {
          channel: postQueryDefinition.pusherChannel,
          name: postQueryDefinition.pusherEvent,
          data: { message: 'Post data updated' },
        },
      ];

      for (const membership of post.event.memberships) {
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
            `Send pusher notifications for reply creation: ${reply.id}`
          )
        );
      }

      // Create post notifications (external service - retry with graceful degradation)
      yield* _(
        externalServiceOperation(
          async () => {
            const [error, result] = await createPostNotifs(
              postId,
              'NEW_REPLY',
              userId
            );
            if (error) throw error;
            return result;
          },
          _error => new Error('Failed to create post notifications'),
          `Create post notifications for reply: ${reply.id}`
        )
      );

      return reply;
    }),
    'reply',
    'createReply',
    postId
  );

// Modernized Effect-based function to update reply
export const updateReplyEffect = (
  replyId: string,
  text: string,
  userId: string
) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch reply with post (database operation with retry)
      const reply = yield* _(
        dbOperation(
          () =>
            db.reply.findUnique({
              where: { id: replyId },
              include: {
                post: true,
              },
            }),
          _error => new ReplyNotFoundError(replyId),
          `Fetch reply for update: ${replyId}`
        )
      );

      if (!reply) {
        return yield* _(Effect.fail(new ReplyNotFoundError(replyId)));
      }

      // Check authorization (business logic - no retry)
      if (reply.authorId !== userId) {
        return yield* _(
          Effect.fail(new ReplyUnauthorizedError('User not authorized'))
        );
      }

      // Update the reply (database operation with retry)
      yield* _(
        dbOperation(
          () =>
            db.reply.update({
              where: { id: replyId },
              data: { text: text },
            }),
          _error => new ReplyUpdateError(_error),
          `Update reply: ${replyId}`
        )
      );

      // Send pusher notifications (external service - retry with graceful degradation)
      const eventQueryDefinition = getEventQuery(reply.post.eventId);
      const postQueryDefinition = getPostQuery(reply.post.id);

      yield* _(
        externalServiceOperation(
          () =>
            Promise.all([
              getPusherServer().trigger(
                eventQueryDefinition.pusherChannel,
                eventQueryDefinition.pusherEvent,
                { message: 'Event data updated' }
              ),
              getPusherServer().trigger(
                postQueryDefinition.pusherChannel,
                postQueryDefinition.pusherEvent,
                { message: 'Post data updated' }
              ),
            ]),
          _error => new Error('Failed to send pusher notifications'),
          `Send pusher notifications for reply update: ${replyId}`
        )
      );

      return { message: 'Reply updated' };
    }),
    'reply',
    'updateReply',
    replyId
  );

// Modernized Effect-based function to delete reply
export const deleteReplyEffect = (replyId: string, userId: string) =>
  SentryHelpers.withServiceOperation(
    Effect.gen(function* (_) {
      // Fetch reply with post, event, and memberships (database operation with retry)
      const reply = yield* _(
        dbOperation(
          () =>
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
            }),
          _error => new ReplyNotFoundError(replyId),
          `Fetch reply for deletion: ${replyId}`
        )
      );

      if (!reply) {
        return yield* _(Effect.fail(new ReplyNotFoundError(replyId)));
      }

      // Check authorization (business logic - no retry)
      const currentUserMembership = reply.post.event.memberships.find(
        membership => membership.personId === userId
      );

      if (!currentUserMembership) {
        return yield* _(
          Effect.fail(
            new ReplyUnauthorizedError('You are not a member of this event')
          )
        );
      }

      if (
        reply.authorId !== userId &&
        currentUserMembership.role === 'ATTENDEE'
      ) {
        return yield* _(
          Effect.fail(new ReplyUnauthorizedError('User not authorized'))
        );
      }

      // Delete the reply (database operation with retry)
      yield* _(
        dbOperation(
          () =>
            db.reply.delete({
              where: { id: replyId },
            }),
          _error => new ReplyDeletionError(_error),
          `Delete reply: ${replyId}`
        )
      );

      // Send pusher notifications (external service - retry with graceful degradation)
      const eventQueryDefinition = getEventQuery(reply.post.eventId);
      const postQueryDefinition = getPostQuery(reply.post.id);

      yield* _(
        externalServiceOperation(
          () =>
            Promise.all([
              getPusherServer().trigger(
                eventQueryDefinition.pusherChannel,
                eventQueryDefinition.pusherEvent,
                { message: 'Event data updated' }
              ),
              getPusherServer().trigger(
                postQueryDefinition.pusherChannel,
                postQueryDefinition.pusherEvent,
                { message: 'Post data updated' }
              ),
            ]),
          _error => new Error('Failed to send pusher notifications'),
          `Send pusher notifications for reply deletion: ${replyId}`
        )
      );

      return { message: 'Reply deleted' };
    }),
    'reply',
    'deleteReply',
    replyId
  );

// ============================================================================
// SAFE WRAPPERS WITH CUSTOM ERROR TYPES
// ============================================================================

export const createReply = safeWrapper<
  [string, string, string, string],
  z.infer<typeof CreatedReplySchema>,
  ReplyUnauthorizedError | ReplyCreationError
>(
  (postId: string, text: string, authorId: string, userId: string) =>
    Effect.runPromise(createReplyEffect(postId, text, authorId, userId)),
  CreatedReplySchema
);

export const updateReply = safeWrapper<
  [string, string, string],
  z.infer<typeof OperationSuccessSchema>,
  ReplyNotFoundError | ReplyUnauthorizedError | ReplyUpdateError
>(
  (replyId: string, text: string, userId: string) =>
    Effect.runPromise(updateReplyEffect(replyId, text, userId)),
  OperationSuccessSchema
);

export const deleteReply = safeWrapper<
  [string, string],
  z.infer<typeof OperationSuccessSchema>,
  ReplyNotFoundError | ReplyUnauthorizedError | ReplyDeletionError
>(
  (replyId: string, userId: string) =>
    Effect.runPromise(deleteReplyEffect(replyId, userId)),
  OperationSuccessSchema
);
