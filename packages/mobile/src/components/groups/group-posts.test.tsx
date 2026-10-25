import { expect, it, vi } from 'vitest';
import type { Id } from 'convex/_generated/dataModel';
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
import { GroupPostDetail, GroupPostEditor } from './group-posts';
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
