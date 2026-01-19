'use client';

import { FullPostClient } from './full-post-client';

/**
 * Simple wrapper that passes postId to FullPostClient
 * FullPostClient handles its own data fetching via Convex hooks
 */
export function FullPost({ postId }: { postId: string }) {
  return <FullPostClient postId={postId} />;
}
