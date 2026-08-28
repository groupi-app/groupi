import { Children, isValidElement, type ReactElement } from 'react';
import { router } from 'expo-router';
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
  authorId: 'person-1',
  author: { name: 'Avery', image: null },
};

interface FlatListTestProps {
  contentContainerClassName: string;
  ListEmptyComponent: ReactElement<{ message?: string }>;
  ListFooterComponent: ReactElement<{ accessibilityRole?: string }> | null;
  onEndReached: () => void;
  onEndReachedThreshold: number;
}

interface NewPostButtonTestProps {
  accessibilityLabel: string;
  onPress: () => void;
}

function createFeed(
  status: 'LoadingFirstPage' | 'CanLoadMore' | 'LoadingMore' | 'Exhausted',
  posts = [post]
) {
  return PostFeed({
    eventId: 'event-123',
    currentPersonId: 'person-current',
    userRole: 'ATTENDEE',
    header: <></>,
    posts,
    status,
    loadMore: mocks.loadMore,
  });
}

function feedChildren(feed: ReturnType<typeof createFeed>) {
  return Children.toArray(feed.props.children).filter(
    isValidElement
  ) as ReactElement<Record<string, unknown>>[];
}

function getList(feed: ReturnType<typeof createFeed>) {
  const list = feedChildren(feed).find(child => child.type === 'FlatList');
  if (!list) throw new Error('Post feed FlatList was not rendered');
  return list as unknown as ReactElement<FlatListTestProps>;
}

function getNewPostButton(feed: ReturnType<typeof createFeed>) {
  const button = feedChildren(feed).find(child => child.type === 'Pressable');
  if (!button) throw new Error('New post button was not rendered');
  return button as unknown as ReactElement<NewPostButtonTestProps>;
}

describe('PostFeed infinite scrolling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests one more chunk only when the cursor can advance', () => {
    expect(shouldLoadMorePosts('CanLoadMore')).toBe(true);
    expect(shouldLoadMorePosts('LoadingMore')).toBe(false);
    expect(shouldLoadMorePosts('Exhausted')).toBe(false);

    getList(createFeed('CanLoadMore')).props.onEndReached();
    expect(mocks.loadMore).toHaveBeenCalledWith(POST_FEED_PAGE_SIZE);

    mocks.loadMore.mockClear();
    getList(createFeed('LoadingMore')).props.onEndReached();
    getList(createFeed('Exhausted')).props.onEndReached();
    expect(mocks.loadMore).not.toHaveBeenCalled();
  });

  it('renders initial and incremental loading states without page controls', () => {
    const initial = getList(createFeed('LoadingFirstPage', []));
    const loadingMore = getList(createFeed('LoadingMore'));

    expect(initial.props.ListEmptyComponent.props.message).toBe(
      'Loading posts...'
    );
    expect(loadingMore.props.ListFooterComponent?.props.accessibilityRole).toBe(
      'progressbar'
    );
    expect(loadingMore.props.onEndReachedThreshold).toBe(0.5);
  });

  it('floats the new-post action above a padded feed', () => {
    const feed = createFeed('Exhausted');
    const list = getList(feed);
    const button = getNewPostButton(feed);

    expect(list.props.contentContainerClassName).toContain('pb-32');
    expect(button.props.accessibilityLabel).toBe('Create new post');

    button.props.onPress();

    expect(router.push).toHaveBeenCalledWith('/event/event-123/new-post');
  });
});
