import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  loadMore: vi.fn(),
}));

vi.mock('react', async importOriginal => {
  const actual = (await importOriginal()) as typeof import('react');
  return {
    ...actual,
    useCallback: <T,>(callback: T) => callback,
    useMemo: <T,>(factory: () => T) => factory(),
  };
});

vi.mock('uniwind', () => ({ useCSSVariable: () => '#123456' }));
vi.mock('./post-card', () => ({ PostCard: 'PostCard' }));
vi.mock('@/components/molecules', () => ({ LoadingState: 'LoadingState' }));
vi.mock('@/components/ui/section-header', () => ({
  SectionHeader: 'SectionHeader',
}));
vi.mock('@/components/ui/text', () => ({ Text: 'Text' }));

import { POST_FEED_PAGE_SIZE } from '@/hooks/use-paginated-event-posts';
import { PostFeed, shouldLoadMorePosts } from './post-feed';

const post = {
  _id: 'post-1',
  title: 'Hello',
  content: 'World',
  _creationTime: 1,
  author: { name: 'Avery', image: null },
};

function createFeed(
  status: 'LoadingFirstPage' | 'CanLoadMore' | 'LoadingMore' | 'Exhausted',
  posts = [post]
) {
  return PostFeed({
    eventId: 'event-123',
    header: <></>,
    posts,
    status,
    loadMore: mocks.loadMore,
  });
}

describe('PostFeed infinite scrolling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests one more chunk only when the cursor can advance', () => {
    expect(shouldLoadMorePosts('CanLoadMore')).toBe(true);
    expect(shouldLoadMorePosts('LoadingMore')).toBe(false);
    expect(shouldLoadMorePosts('Exhausted')).toBe(false);

    createFeed('CanLoadMore').props.onEndReached();
    expect(mocks.loadMore).toHaveBeenCalledWith(POST_FEED_PAGE_SIZE);

    mocks.loadMore.mockClear();
    createFeed('LoadingMore').props.onEndReached();
    createFeed('Exhausted').props.onEndReached();
    expect(mocks.loadMore).not.toHaveBeenCalled();
  });

  it('renders initial and incremental loading states without page controls', () => {
    const initial = createFeed('LoadingFirstPage', []);
    const loadingMore = createFeed('LoadingMore');

    expect(initial.type).toBe('FlatList');
    expect(initial.props.ListEmptyComponent.props.message).toBe(
      'Loading posts...'
    );
    expect(loadingMore.props.ListFooterComponent.props.accessibilityRole).toBe(
      'progressbar'
    );
    expect(loadingMore.props.onEndReachedThreshold).toBe(0.5);
  });
});
