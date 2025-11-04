'use server';

import { updateTag } from 'next/cache';
import { createPost, updatePost, deletePost } from '@groupi/services';
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
// POST ACTIONS
// ============================================================================

type PostMutationError =
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
  const result = await createPost({
    title: input.title,
    content: input.content,
    eventId: input.eventId,
  });

  // Invalidate event posts cache on successful creation
  if (!result[0]) {
    updateTag(`event-${input.eventId}`);
    updateTag(`event-${input.eventId}-posts`);
  }

  return result;
}

/**
 * Update an existing post
 * Returns: [error, post] tuple
 */
export async function updatePostAction(
  input: UpdatePostInput
): Promise<ResultTuple<PostMutationError, PostData>> {
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
      updateTag(`event-${result[1].eventId}`);
      updateTag(`event-${result[1].eventId}-posts`);
    }
  }

  return result;
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
  const result = await deletePost({
    postId: input.postId,
  });

  // Invalidate post cache on successful deletion
  if (!result[0] && result[1] && 'eventId' in result[1] && result[1].eventId) {
    updateTag(`post-${input.postId}`);
    updateTag(`event-${result[1].eventId}`);
    updateTag(`event-${result[1].eventId}-posts`);
  }

  return result;
}
