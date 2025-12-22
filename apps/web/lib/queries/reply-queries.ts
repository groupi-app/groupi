import { fetchPostDetail } from './post-queries';
import type { PostDetailPageData } from '@groupi/schema/data';

/**
 * Query adapter functions for replies
 * Note: Replies are included in post detail, so we reuse post detail query
 */

/**
 * Fetches replies for a post
 * Since replies are included in post detail, we reuse fetchPostDetail
 * and extract replies from the result
 * @param postId - Post ID
 * @returns Array of replies or throws error
 */
export async function fetchReplies(
  postId: string
): Promise<PostDetailPageData['post']['replies']> {
  const postDetail = await fetchPostDetail(postId);
  return postDetail.post.replies;
}

