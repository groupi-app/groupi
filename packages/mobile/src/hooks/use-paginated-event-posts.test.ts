import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  usePaginatedQuery: vi.fn(),
}));

vi.mock('convex/react', () => ({
  usePaginatedQuery: mocks.usePaginatedQuery,
}));

vi.mock('convex/_generated/api', () => ({
  api: {
    posts: {
      queries: { getEventPostFeedPage: 'getEventPostFeedPage' },
    },
  },
}));

import {
  POST_FEED_PAGE_SIZE,
  usePaginatedEventPosts,
} from './use-paginated-event-posts';

describe('usePaginatedEventPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.usePaginatedQuery.mockReturnValue({
      results: [],
      status: 'LoadingFirstPage',
      isLoading: true,
      loadMore: vi.fn(),
    });
  });

  it('uses the cursor query with a bounded initial chunk', () => {
    const result = usePaginatedEventPosts('event-123' as never);

    expect(mocks.usePaginatedQuery).toHaveBeenCalledWith(
      'getEventPostFeedPage',
      { eventId: 'event-123' },
      { initialNumItems: POST_FEED_PAGE_SIZE }
    );
    expect(result.status).toBe('LoadingFirstPage');
  });
});
