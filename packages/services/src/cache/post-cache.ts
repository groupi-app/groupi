'use cache: private';

import { cacheTag, cacheLife } from 'next/cache';
import type { ResultTuple, SerializedError } from '@groupi/schema';
import { serializeResultTuple } from '@groupi/schema';
import { fetchPostDetailPageData, getPostFeedData } from '../domains/post';
import type { PostDetailPageData, PostFeedData } from '@groupi/schema/data';
import type {
  NotFoundError,
  UnauthorizedError,
  AuthenticationError,
  DatabaseError,
  ConnectionError,
  ConstraintError,
} from '@groupi/schema';

// ============================================================================
// CACHED HELPERS (Only cache successful results)
// ============================================================================

/**
 * Cached wrapper that only caches successful PostFeedData
 * Errors are not cached to prevent serialization issues
 */
async function getCachedPostFeedDataSuccess(
  eventId: string
): Promise<PostFeedData> {
  'use cache: private';

  cacheLife('posts');
  cacheTag(`event-${eventId}`, `event-${eventId}-posts`);

  const result = await getPostFeedData({
    eventId,
    limit: 100,
    cursor: undefined,
  });

  if (result[0]) {
    throw result[0]; // Throw error instead of returning tuple
  }
  return result[1];
}

// ============================================================================
// POST CACHE FUNCTIONS (PRIVATE)
// ============================================================================
// Note: Using "use cache: private" because our service layer uses getUserId()
// which accesses headers(). Posts are still cached per user, with shared postId tags.

/**
 * Cached post detail with replies - PRIVATE per user
 * Cache for 30 seconds with post-specific tag for invalidation
 * Short cache due to frequent updates
 */
export async function getCachedPostWithReplies(
  postId: string
): Promise<ResultTuple<SerializedError, PostDetailPageData>> {
  'use cache: private';

  cacheLife('posts');
  cacheTag(`post-${postId}`, `post-${postId}-replies`);

  const result = await fetchPostDetailPageData({ postId });

  return serializeResultTuple(result);
}

/**
 * Cached post feed for an event - PRIVATE per user
 * Cache for 30 seconds with event-posts tag for invalidation
 * Short cache due to frequent updates
 * Only caches successful results - errors are returned without caching
 */
export async function getCachedPostFeedData(
  eventId: string
): Promise<ResultTuple<SerializedError, PostFeedData>> {
  try {
    const data = await getCachedPostFeedDataSuccess(eventId);
    return serializeResultTuple([null, data] as [null, PostFeedData]);
  } catch (error) {
    // Errors are not cached - serialize error tuple for cache safety
    if (
      error &&
      typeof error === 'object' &&
      '_tag' in error &&
      typeof (error as { _tag: unknown })._tag === 'string'
    ) {
      const errorTuple: ResultTuple<
        | NotFoundError
        | UnauthorizedError
        | AuthenticationError
        | DatabaseError
        | ConnectionError
        | ConstraintError,
        PostFeedData
      > = [
        error as
          | NotFoundError
          | UnauthorizedError
          | AuthenticationError
          | DatabaseError
          | ConnectionError
          | ConstraintError,
        undefined,
      ];
      return serializeResultTuple<
        | NotFoundError
        | UnauthorizedError
        | AuthenticationError
        | DatabaseError
        | ConnectionError
        | ConstraintError,
        PostFeedData
      >(errorTuple);
    }
    // Fallback for unexpected error types
    return [{ _tag: 'UnknownError' }, undefined];
  }
}
