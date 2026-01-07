'use server';

import { updateTag } from 'next/cache';
import { createPost, updatePost, deletePost } from '@groupi/services';
import { pusherServer } from '@/lib/pusher-server';
import type { ResultTuple } from '@groupi/schema';
import type {
  NotFoundError,
  UnauthorizedError,
  DatabaseError,
  ValidationError,
  AuthenticationError,
  ConnectionError,
  ConstraintError,
  OperationError,
} from '@groupi/schema';
import { createLogger, pusherLogger } from '@/lib/logger';
import { withActionTrace } from '@/lib/action-trace';

const actionLogger = createLogger('actions');

// ============================================================================
// POST ACTIONS
// ============================================================================

export type PostMutationError =
  | NotFoundError
  | UnauthorizedError
  | DatabaseError
  | ValidationError
  | AuthenticationError
  | ConnectionError
  | ConstraintError
  | OperationError;

interface CreatePostInput {
  title: string;
  content: string;
  eventId: string;
}

interface UpdatePostInput {
  id: string;
  title?: string;
  content?: string;
}

interface DeletePostInput {
  postId: string;
}

interface PostData {
  id: string;
  title: string;
  content: string;
  eventId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a new post
 * Returns: [error, post] tuple
 */
export async function createPostAction(
  input: CreatePostInput
): Promise<ResultTuple<PostMutationError, PostData>> {
  return withActionTrace('createPost', async () => {
    const result = await createPost({
      title: input.title,
      content: input.content,
      eventId: input.eventId,
    });

    // Log errors for debugging
    if (result[0]) {
      actionLogger.error(
        {
          error: result[0],
          errorType: result[0].constructor.name,
          errorMessage: result[0].message,
          eventId: input.eventId,
          title: input.title,
        },
        'Error creating post'
      );
    }

    // Invalidate event posts cache on successful creation
    if (!result[0] && result[1]) {
      updateTag(`event-${input.eventId}`);
      updateTag(`event-${input.eventId}-posts`);

      // Trigger Pusher event for other users
      await pusherServer
        .trigger(`event-${input.eventId}-posts`, 'post-changed', {
          type: 'INSERT',
          new: result[1],
        })
        .catch((err: unknown) => {
          // Log but don't fail the action if Pusher fails
          pusherLogger.error(
            {
              error: err,
              eventId: input.eventId,
              operation: 'post-changed',
              type: 'INSERT',
            },
            'Failed to trigger post-changed event'
          );
        });
    }

    return result;
  });
}

/**
 * Update an existing post
 * Returns: [error, post] tuple
 */
export async function updatePostAction(
  input: UpdatePostInput
): Promise<ResultTuple<PostMutationError, PostData>> {
  return withActionTrace('updatePost', async () => {
    const result = await updatePost({
      id: input.id,
      title: input.title,
      content: input.content,
    });

    // Invalidate post cache on successful update
    if (!result[0] && result[1]) {
      updateTag(`post-${input.id}`);
      // Also invalidate event posts if we know the eventId
      if ('eventId' in result[1] && result[1].eventId) {
        const eventId = result[1].eventId;
        updateTag(`event-${eventId}`);
        updateTag(`event-${eventId}-posts`);

        // Trigger Pusher event for other users
        await pusherServer
          .trigger(`event-${eventId}-posts`, 'post-changed', {
            type: 'UPDATE',
            new: result[1],
          })
          .catch((err: unknown) => {
            pusherLogger.error(
              {
                error: err,
                eventId,
                operation: 'post-changed',
                type: 'UPDATE',
              },
              'Failed to trigger post-changed event'
            );
          });
      }
    }

    return result;
  });
}

/**
 * Delete a post
 * Returns: [error, { message, eventId }] tuple
 */
export async function deletePostAction(
  input: DeletePostInput
): Promise<
  ResultTuple<PostMutationError, { message: string; eventId?: string }>
> {
  return withActionTrace('deletePost', async () => {
    const result = await deletePost({
      postId: input.postId,
    });

    // Log errors for debugging
    if (result[0]) {
      actionLogger.error(
        {
          error: result[0],
          errorType: result[0].constructor.name,
          errorMessage: result[0].message,
          postId: input.postId,
        },
        'Error deleting post'
      );
    }

    // Invalidate post cache on successful deletion
    if (
      !result[0] &&
      result[1] &&
      'eventId' in result[1] &&
      result[1].eventId
    ) {
      const eventId = result[1].eventId;
      updateTag(`post-${input.postId}`);
      updateTag(`event-${eventId}`);
      updateTag(`event-${eventId}-posts`);

      // Trigger Pusher event for other users
      await pusherServer
        .trigger(`event-${eventId}-posts`, 'post-changed', {
          type: 'DELETE',
          old: { id: input.postId },
        })
        .catch((err: unknown) => {
          pusherLogger.error(
            {
              error: err,
              eventId,
              operation: 'post-changed',
              type: 'DELETE',
            },
            'Failed to trigger post-changed event'
          );
        });
    }

    return result;
  });
}
