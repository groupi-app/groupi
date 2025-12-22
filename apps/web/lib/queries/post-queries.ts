import {
  fetchPostFeedAction,
  fetchPostDetailAction,
} from '@/actions/query-actions';
import type { PostFeedData, PostDetailPageData } from '@groupi/schema/data';

/**
 * Query adapter functions for posts
 * Convert result tuples [error, data] to React Query format (throw on error)
 * These call server actions which safely wrap cache functions
 */

/**
 * Fetches post feed data for an event
 * Adapter: Converts result tuple to React Query format
 * @param eventId - Event ID
 * @returns PostFeedData or throws error
 */
export async function fetchPostFeed(eventId: string): Promise<PostFeedData> {
  const [error, data] = await fetchPostFeedAction(eventId);

  if (error) {
    // React Query catches thrown errors and provides them via error state
    throw error;
  }

  return data;
}

/**
 * Fetches post detail with replies
 * Adapter: Converts result tuple to React Query format
 * @param postId - Post ID
 * @returns PostDetailPageData or throws error
 */
export async function fetchPostDetail(
  postId: string
): Promise<PostDetailPageData> {
  const [error, data] = await fetchPostDetailAction(postId);

  if (error) {
    // React Query catches thrown errors and provides them via error state
    throw error;
  }

  return data;
}
