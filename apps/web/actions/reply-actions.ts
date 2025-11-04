'use server';

import { updateTag } from 'next/cache';
import { createReply, updateReply, deleteReply } from '@groupi/services';
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

// ============================================================================
// REPLY ACTIONS
// ============================================================================

type ReplyMutationError =
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
): Promise<ResultTuple<ReplyMutationError, ReplyData>> {
  const result = await createReply({
    postId: input.postId,
    content: input.text,
  });

  // Invalidate post replies cache on successful creation
  if (!result[0]) {
    updateTag(`post-${input.postId}`);
    updateTag(`post-${input.postId}-replies`);
  }

  return result;
}

/**
 * Update an existing reply
 * Returns: [error, { message }] tuple
 */
export async function updateReplyAction(
  input: UpdateReplyInput
): Promise<ResultTuple<ReplyMutationError, { message: string }>> {
  const result = await updateReply({
    replyId: input.replyId,
    content: input.text,
  });

  // Invalidate reply cache on successful update
  if (!result[0]) {
    updateTag(`reply-${input.replyId}`);
  }

  return result;
}

/**
 * Delete a reply
 * Returns: [error, { message }] tuple
 */
export async function deleteReplyAction(
  input: DeleteReplyInput
): Promise<
  ResultTuple<ReplyMutationError, { message: string; postId?: string }>
> {
  const result = await deleteReply({
    replyId: input.replyId,
  });

  // Invalidate reply cache on successful deletion
  if (!result[0] && result[1] && 'postId' in result[1] && result[1].postId) {
    updateTag(`reply-${input.replyId}`);
    updateTag(`post-${result[1].postId}`);
    updateTag(`post-${result[1].postId}-replies`);
  }

  return result;
}
