'use server';

import { updateTag } from 'next/cache';
import { createReply, updateReply, deleteReply } from '@groupi/services';
import { pusherServer } from '@/lib/pusher-server';
import type { ResultTuple, SerializedError } from '@groupi/schema';
import { serializeResultTuple } from '@groupi/schema';
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
import { pusherLogger } from '@/lib/logger';
import { withActionTrace } from '@/lib/action-trace';

// ============================================================================
// REPLY ACTIONS
// ============================================================================

export type ReplyMutationError =
  | NotFoundError
  | UnauthorizedError
  | DatabaseError
  | ValidationError
  | AuthenticationError
  | ConnectionError
  | ConstraintError
  | OperationError;

interface CreateReplyInput {
  postId: string;
  text: string;
}

interface UpdateReplyInput {
  replyId: string;
  text: string;
}

interface DeleteReplyInput {
  replyId: string;
}

interface ReplyData {
  id: string;
  text: string;
  postId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a new reply to a post
 * Returns: [error, reply] tuple
 */
export async function createReplyAction(
  input: CreateReplyInput
): Promise<ResultTuple<SerializedError, ReplyData>> {
  return withActionTrace('createReply', async () => {
    const result = await createReply({
      postId: input.postId,
      content: input.text,
    });

    // Invalidate post replies cache on successful creation
    if (!result[0] && result[1]) {
      updateTag(`post-${input.postId}`);
      updateTag(`post-${input.postId}-replies`);

      // Fetch full reply data with author for Pusher event
      // We need to fetch it because createReply only returns ReplyData (without author)
      try {
        const { getCachedPostWithReplies } = await import(
          '@groupi/services/server'
        );
        const [postError, postData] = await getCachedPostWithReplies(
          input.postId
        );

        if (!postError && postData) {
          const fullReply = postData.post.replies.find(
            r => r.id === result[1].id
          );

          if (fullReply) {
            // Trigger Pusher event for real-time updates
            await pusherServer
              .trigger(`post-${input.postId}-replies`, 'reply-changed', {
                type: 'INSERT',
                new: fullReply,
              })
              .catch((err: unknown) => {
                const errorMessage =
                  err instanceof Error ? err.message : String(err);
                pusherLogger.error(
                  {
                    error: errorMessage,
                    postId: input.postId,
                    operation: 'reply-changed',
                    type: 'INSERT',
                  },
                  'Failed to trigger reply-changed event'
                );
              });
          }
        }
      } catch (err) {
        // Silently fail Pusher event - reply was already created successfully
        // Log error safely without passing Error objects
        const errorMessage = err instanceof Error ? err.message : String(err);
        pusherLogger.error(
          {
            error: errorMessage,
            postId: input.postId,
            operation: 'reply-changed',
            type: 'INSERT',
          },
          'Failed to fetch post data for Pusher event'
        );
      }
    }

    // Serialize the result tuple to prevent Error object serialization issues
    return serializeResultTuple(result);
  });
}

/**
 * Update an existing reply
 * Returns: [error, ReplyData with postId] tuple
 */
export async function updateReplyAction(
  input: UpdateReplyInput
): Promise<ResultTuple<SerializedError, ReplyData & { postId: string }>> {
  return withActionTrace('updateReply', async () => {
    const result = await updateReply({
      replyId: input.replyId,
      content: input.text,
    });

    // Invalidate reply cache and trigger Pusher event on successful update
    if (!result[0] && result[1]) {
      const updatedReply = result[1];
      updateTag(`reply-${input.replyId}`);
      updateTag(`post-${updatedReply.postId}`);
      updateTag(`post-${updatedReply.postId}-replies`);

      // Fetch full reply data with author for Pusher event
      // We need to fetch it because updateReply only returns ReplyData (without author)
      try {
        const { getCachedPostWithReplies } = await import(
          '@groupi/services/server'
        );
        const [postError, postData] = await getCachedPostWithReplies(
          updatedReply.postId
        );

        if (!postError && postData) {
          const fullReply = postData.post.replies.find(
            r => r.id === updatedReply.id
          );

          if (fullReply) {
            // Trigger Pusher event for real-time updates
            await pusherServer
              .trigger(`post-${updatedReply.postId}-replies`, 'reply-changed', {
                type: 'UPDATE',
                new: fullReply,
              })
              .catch((err: unknown) => {
                const errorMessage =
                  err instanceof Error ? err.message : String(err);
                pusherLogger.error(
                  {
                    error: errorMessage,
                    postId: updatedReply.postId,
                    replyId: input.replyId,
                    operation: 'reply-changed',
                    type: 'UPDATE',
                  },
                  'Failed to trigger reply-changed event'
                );
              });
          }
        }
      } catch (err) {
        // Silently fail Pusher event - reply was already updated successfully
        // Log error safely without passing Error objects
        const errorMessage = err instanceof Error ? err.message : String(err);
        pusherLogger.error(
          {
            error: errorMessage,
            postId: updatedReply.postId,
            replyId: input.replyId,
            operation: 'reply-changed',
            type: 'UPDATE',
          },
          'Failed to fetch post data for Pusher event'
        );
      }
    }

    // Serialize the result tuple to prevent Error object serialization issues
    return serializeResultTuple(result);
  });
}

/**
 * Delete a reply
 * Returns: [error, { message }] tuple
 */
export async function deleteReplyAction(
  input: DeleteReplyInput
): Promise<ResultTuple<SerializedError, { message: string; postId?: string }>> {
  return withActionTrace('deleteReply', async () => {
    const result = await deleteReply({
      replyId: input.replyId,
    });

    // Invalidate reply cache on successful deletion
    if (!result[0] && result[1] && 'postId' in result[1] && result[1].postId) {
      const postId = result[1].postId;
      updateTag(`reply-${input.replyId}`);
      updateTag(`post-${postId}`);
      updateTag(`post-${postId}-replies`);

      // Trigger Pusher event for other users
      await pusherServer
        .trigger(`post-${postId}-replies`, 'reply-changed', {
          type: 'DELETE',
          old: { id: input.replyId },
        })
        .catch((err: unknown) => {
          const errorMessage = err instanceof Error ? err.message : String(err);
          pusherLogger.error(
            {
              error: errorMessage,
              postId,
              operation: 'reply-changed',
              type: 'DELETE',
            },
            'Failed to trigger reply-changed event'
          );
        });
    }

    // Serialize the result tuple to prevent Error object serialization issues
    return serializeResultTuple(result);
  });
}
