import { expect, it, vi } from 'vitest';
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useQuery } from 'convex/react';
import { useGroup } from '../../hooks/use-groups';
import { useGroupPosts } from '../../hooks/use-group-posts';
import type { Id } from 'convex/_generated/dataModel';
vi.unmock('convex/_generated/api');
vi.mock('react', async original => ({
  ...(await original<typeof import('react')>()),
  useState: () => [null, vi.fn()],
}));
vi.mock('../../context/global-user-context', () => ({
  useGlobalUser: () => ({ person: { _id: 'me' } }),
}));
vi.mock('../posts/new-post-screen', () => ({ NewPostScreen: 'NewPostScreen' }));
vi.mock('../posts/edit-post-screen', () => ({
  EditPostScreen: 'EditPostScreen',
}));
vi.mock('../posts/post-detail-screen', () => ({
  PostDetailScreen: 'PostDetailScreen',
}));
vi.mock('../posts/post-card', () => ({ PostCard: 'PostCard' }));
vi.mock('../../hooks/use-groups', () => ({ useGroup: vi.fn() }));
vi.mock('../../hooks/use-group-posts', () => ({ useGroupPosts: vi.fn() }));
import { GroupPosts, GroupPostDetail, GroupPostEditor } from './group-posts';
const groupId = 'group' as Id<'groups'>;
const postId = 'post' as Id<'posts'>;
it('uses canonical new/edit native screens with an explicit Group parent', () => {
  expect(GroupPostEditor({ groupId }).props).toEqual({ groupId });
  expect(GroupPostEditor({ groupId, postId }).props).toEqual({
    groupId,
    postId,
  });
  expect(GroupPostEditor({ groupId }).type).toBe('NewPostScreen');
  expect(GroupPostEditor({ groupId, postId }).type).toBe('EditPostScreen');
});
it('opens the same canonical detail screen without inventing an Event ID', () => {
  expect(GroupPostDetail({ groupId, postId }).props).toEqual({
    groupId,
    postId,
  });
  expect(GroupPostDetail({ groupId, postId }).type).toBe('PostDetailScreen');
});

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [
    node,
    ...Children.toArray(node.props.children as ReactNode).flatMap(elements),
  ];
}
it('keeps Group pins above each cursor page and deduplicates reactive overlap', () => {
  vi.mocked(useGroup).mockReturnValue({ viewerRole: 'MEMBER' } as never);
  vi.mocked(useQuery).mockReturnValue([
    { _id: 'pinned', title: 'Pinned', pinnedAt: 20 },
  ]);
  vi.mocked(useGroupPosts).mockReturnValue({
    page: [
      { _id: 'new', title: 'New' },
      { _id: 'pinned', title: 'Old copy' },
    ],
    isDone: false,
    continueCursor: 'next',
  } as never);
  const tree = elements(GroupPosts({ groupId }));
  expect(useGroupPosts).toHaveBeenCalledWith({
    groupId,
    excludePinned: true,
    paginationOpts: { cursor: null, numItems: 20 },
  });
  expect(
    tree
      .filter(node => node.type === 'PostCard')
      .map(node => (node.props.post as { _id: string })._id)
  ).toEqual(['pinned', 'new']);
});
it('skips pin and chronological reads when required Group onboarding is incomplete', () => {
  vi.mocked(useGroup).mockReturnValue({
    joiningQuestionnaire: { canAccessMemberContent: false },
  } as never);
  GroupPosts({ groupId });
  expect(useQuery).toHaveBeenLastCalledWith(expect.anything(), 'skip');
  expect(useGroupPosts).toHaveBeenLastCalledWith('skip');
});
