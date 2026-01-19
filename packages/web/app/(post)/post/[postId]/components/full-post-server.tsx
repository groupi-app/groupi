import { FullPostClient } from './full-post-client';

/**
 * Server wrapper component - Client-only architecture
 * - Simply passes postId to client component
 * - All data fetching and real-time updates handled client-side
 * - Enables mobile compatibility and consistent patterns
 */
export function FullPostServer({ postId }: { postId: string }) {
  return <FullPostClient postId={postId} />;
}
