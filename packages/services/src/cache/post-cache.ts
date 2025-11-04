'use cache: private';

import { cacheTag, cacheLife } from 'next/cache';
import type { ResultTuple } from '@groupi/schema';
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
): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | AuthenticationError
    | DatabaseError
    | ConnectionError
    | ConstraintError,
    PostDetailPageData
  >
> {
  'use cache: private';
  cacheLife('posts');
  cacheTag(`post-${postId}`, `post-${postId}-replies`);

  return await fetchPostDetailPageData({ postId });
}

/**
 * Cached post feed for an event - PRIVATE per user
 * Cache for 30 seconds with event-posts tag for invalidation
 * Short cache due to frequent updates
 */
export async function getCachedPostFeedData(
  eventId: string
): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | AuthenticationError
    | DatabaseError
    | ConnectionError
    | ConstraintError,
    PostFeedData
  >
> {
  'use cache: private';
  cacheLife('posts');
  cacheTag(`event-${eventId}`, `event-${eventId}-posts`);

  return await getPostFeedData({ eventId, limit: 100, cursor: undefined });
}
