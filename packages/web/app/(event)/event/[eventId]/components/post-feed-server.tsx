import { PostFeedClient } from './post-feed-client';

/**
 * Server wrapper component - Client-only architecture
 * - Simply passes eventId to client component
 * - All data fetching and real-time updates handled client-side
 * - Enables mobile compatibility and consistent patterns
 */
export function PostFeedServer({ eventId }: { eventId: string }) {
  return <PostFeedClient eventId={eventId} />;
}
