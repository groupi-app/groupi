import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PostFeed } from '@/app/(event)/event/[eventId]/components/post-feed';
const fixture = vi.hoisted(() => ({ pinned: [] as unknown[] | undefined }));
vi.mock('@/hooks/convex/use-post-controls', () => ({
  usePinnedEventPosts: () => fixture.pinned,
}));
vi.mock('@/components/post-card', () => ({
  PostCard: ({ postData }: { postData: { title: string } }) => (
    <article data-feed-item>{postData.title}</article>
  ),
}));
vi.mock('@/components/organisms/group-polls', () => ({
  GroupPollFeed: () => <div data-feed-item>Poll cards</div>,
}));
vi.mock('@/features/content', () => ({
  EventToolScope: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/hooks/convex', () => ({ useEventPostFeed: () => null }));
vi.mock('@/hooks/convex/use-muting', () => ({
  MutedPostsProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('framer-motion', () => ({
  LayoutGroup: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
}));
const post = (id: string, pinnedAt?: number) => ({
  _id: id,
  title: id,
  authorId: 'author',
  recentReplyAuthors: [],
  pinnedAt,
});
const data = (posts: unknown[]) => ({
  event: { _id: 'event', posts, memberships: [] },
  userMembership: { personId: 'viewer', role: 'ATTENDEE' },
});
afterEach(cleanup);
beforeEach(() => {
  fixture.pinned = [];
});
it('renders independently retrieved pins newest first above Polls and excludes every duplicate from the normal feed', () => {
  fixture.pinned = [
    post('older pin', 10),
    post('newest pin', 20),
    post('older pin', 10),
  ];
  const view = render(
    <PostFeed
      data={data([post('normal'), post('older pin', 10), post('newest pin')])}
    />
  );
  expect(
    [...view.container.querySelectorAll('[data-feed-item]')].map(
      node => node.textContent
    )
  ).toEqual(['newest pin', 'older pin', 'Poll cards', 'normal']);
  expect(screen.getAllByText('older pin')).toHaveLength(1);
});
it('does not call a pinned-only feed empty and keeps normal rows readable while pins load', () => {
  fixture.pinned = [post('pinned', 10)];
  const { rerender } = render(<PostFeed data={data([])} />);
  expect(screen.queryByText('No posts yet.')).not.toBeInTheDocument();
  fixture.pinned = undefined;
  rerender(<PostFeed data={data([post('normal')])} />);
  expect(screen.getByRole('status')).toHaveTextContent('Loading pinned');
  expect(screen.getByText('normal')).toBeInTheDocument();
});
