import { usePaginatedQuery, useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

export const POST_FEED_PAGE_SIZE = 15;

/**
 * Loads event posts as a growing reactive list. Convex owns the opaque cursor;
 * the screen only decides when the next chunk should be requested.
 */
export function usePaginatedEventPosts(eventId: Id<'events'>) {
  const pinned = useQuery(api.posts.queries.getPinnedEventPosts, { eventId });
  const feed = usePaginatedQuery(
    api.posts.queries.getEventPostFeedPage,
    { eventId, excludePinned: true },
    { initialNumItems: POST_FEED_PAGE_SIZE }
  );
  const pinnedIds = new Set((pinned ?? []).map(post => post._id));
  return {
    ...feed,
    results: [
      ...(pinned ?? []),
      ...feed.results.filter(post => !pinnedIds.has(post._id)),
    ],
  };
}
