'use server';

import { updateTag } from 'next/cache';
import {
  getAllUsers,
  getAllEvents,
  getAllPosts,
  getAllReplies,
  updateUserAdmin,
  deleteUserAdmin,
  deleteEvent,
  deletePost,
  deleteReply,
} from '@groupi/services';
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
import type {
  UserAdminListItemData,
  EventAdminListItemData,
  PostAdminListItemData,
  ReplyAdminListItemData,
} from '@groupi/schema';
import { withActionTrace } from '@/lib/action-trace';

// ============================================================================
// ADMIN LIST ACTIONS
// ============================================================================

type AdminMutationError =
  | NotFoundError
  | UnauthorizedError
  | DatabaseError
  | ValidationError
  | AuthenticationError
  | ConnectionError
  | ConstraintError
  | OperationError;

/**
 * Get all users for admin dashboard
 * Returns: [error, users] tuple
 */
export async function getAllUsersAction(): Promise<
  ResultTuple<AdminMutationError, UserAdminListItemData[]>
> {
  return withActionTrace('getAllUsers', async () => {
    return await getAllUsers();
  });
}

/**
 * Get all events for admin dashboard with pagination
 * Returns: [error, { items, nextCursor, totalCount }] tuple
 */
export async function getAllEventsAction(params?: {
  cursor?: string;
  limit?: number;
  search?: string;
}): Promise<
  ResultTuple<
    AdminMutationError,
    {
      items: EventAdminListItemData[];
      nextCursor: string | undefined;
      totalCount: number;
    }
  >
> {
  return withActionTrace('getAllEvents', async () => {
    return await getAllEvents(params);
  });
}

/**
 * Get all posts for admin dashboard with pagination
 * Returns: [error, { items, nextCursor, totalCount }] tuple
 */
export async function getAllPostsAction(params?: {
  cursor?: string;
  limit?: number;
  search?: string;
}): Promise<
  ResultTuple<
    AdminMutationError,
    {
      items: PostAdminListItemData[];
      nextCursor: string | undefined;
      totalCount: number;
    }
  >
> {
  return withActionTrace('getAllPosts', async () => {
    return await getAllPosts(params);
  });
}

/**
 * Get all replies for admin dashboard with pagination
 * Returns: [error, { items, nextCursor, totalCount }] tuple
 */
export async function getAllRepliesAction(params?: {
  cursor?: string;
  limit?: number;
  search?: string;
}): Promise<
  ResultTuple<
    AdminMutationError,
    {
      items: ReplyAdminListItemData[];
      nextCursor: string | undefined;
      totalCount: number;
    }
  >
> {
  return withActionTrace('getAllReplies', async () => {
    return await getAllReplies(params);
  });
}

// ============================================================================
// ADMIN MUTATION ACTIONS
// ============================================================================

interface UpdateUserInput {
  id: string;
  name?: string;
  username?: string;
  role?: string;
  image?: string;
}

interface DeleteUserInput {
  id: string;
}

interface DeleteEventInput {
  eventId: string;
}

interface DeletePostInput {
  postId: string;
}

interface DeleteReplyInput {
  replyId: string;
}

/**
 * Update a user (admin only)
 * Returns: [error, { id }] tuple
 */
export async function updateUserAction(
  input: UpdateUserInput
): Promise<ResultTuple<AdminMutationError, { id: string }>> {
  return withActionTrace('updateUser', async () => {
    const result = await updateUserAdmin({
      userId: input.id,
      name: input.name,
      username: input.username,
      role: input.role,
      image: input.image,
    });

    // Invalidate user cache on successful update
    if (!result[0]) {
      updateTag(`user-${input.id}`);
      updateTag('admin-users');
    }

    return result;
  });
}

/**
 * Delete a user (admin only)
 * Returns: [error, { message }] tuple
 */
export async function deleteUserAction(
  input: DeleteUserInput
): Promise<ResultTuple<AdminMutationError, { message: string }>> {
  return withActionTrace('deleteUser', async () => {
    const result = await deleteUserAdmin({ userId: input.id });

    // Invalidate user cache on successful deletion
    if (!result[0]) {
      updateTag(`user-${input.id}`);
      updateTag('admin-users');
    }

    return result;
  });
}

/**
 * Delete an event (admin only)
 * Returns: [error, { message, eventId }] tuple
 */
export async function deleteEventAction(
  input: DeleteEventInput
): Promise<
  ResultTuple<AdminMutationError, { message: string; eventId?: string }>
> {
  return withActionTrace('deleteEvent', async () => {
    const result = await deleteEvent({ eventId: input.eventId });

    // Invalidate event cache on successful deletion
    if (!result[0]) {
      updateTag(`event-${input.eventId}`);
      updateTag('admin-events');
    }

    return result;
  });
}

/**
 * Delete a post (admin only)
 * Returns: [error, { message, eventId }] tuple
 */
export async function deletePostAction(
  input: DeletePostInput
): Promise<
  ResultTuple<AdminMutationError, { message: string; eventId?: string }>
> {
  return withActionTrace('deletePost', async () => {
    const result = await deletePost({ postId: input.postId });

    // Invalidate post cache on successful deletion
    if (
      !result[0] &&
      result[1] &&
      'eventId' in result[1] &&
      result[1].eventId
    ) {
      updateTag(`post-${input.postId}`);
      updateTag(`event-${result[1].eventId}`);
      updateTag(`event-${result[1].eventId}-posts`);
      updateTag('admin-posts');
    }

    return result;
  });
}

/**
 * Delete a reply (admin only)
 * Returns: [error, { message, postId }] tuple
 */
export async function deleteReplyAction(
  input: DeleteReplyInput
): Promise<
  ResultTuple<AdminMutationError, { message: string; postId?: string }>
> {
  return withActionTrace('deleteReply', async () => {
    const result = await deleteReply({ replyId: input.replyId });

    // Invalidate reply cache on successful deletion
    if (!result[0] && result[1] && 'postId' in result[1] && result[1].postId) {
      updateTag(`reply-${input.replyId}`);
      updateTag(`post-${result[1].postId}`);
      updateTag(`post-${result[1].postId}-replies`);
      updateTag('admin-replies');
    }

    return result;
  });
}
