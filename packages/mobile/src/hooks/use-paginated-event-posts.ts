import { usePaginatedQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

export const POST_FEED_PAGE_SIZE = 15;

/**
 * Loads event posts as a growing reactive list. Convex owns the opaque cursor;
 * the screen only decides when the next chunk should be requested.
 */
export function usePaginatedEventPosts(eventId: Id<'events'>) {
  return usePaginatedQuery(
    api.posts.queries.getEventPostFeedPage,
    { eventId },
    { initialNumItems: POST_FEED_PAGE_SIZE }
  );
}
