import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupPostDetail, GroupPostEditor, GroupPosts } from './group-posts';
const state = vi.hoisted(() => ({
  group: { joiningQuestionnaire: { canAccessMemberContent: true } } as unknown,
  post: null as unknown,
  posts: { page: [] as unknown[], isDone: true, continueCursor: '' },
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  push: vi.fn(),
  back: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: state.push, back: state.back }),
}));
vi.mock('@/hooks/convex/use-groups', () => ({ useGroup: () => state.group }));
vi.mock('@/hooks/convex/use-group-posts', () => ({
  useGroupPostReplies: () => ({ page: [], isDone: true, continueCursor: '' }),
  useCreateGroupPostReply: () => vi.fn(),
  useUpdateGroupPostReply: () => vi.fn(),
  useDeleteGroupPostReply: () => vi.fn(),
  useGroupPosts: () => state.posts,
  useGroupPost: () => state.post,
  useCreateGroupPost: () => state.create,
  useUpdateGroupPost: () => state.update,
  useDeleteGroupPost: () => state.remove,
}));
const groupId = 'group' as Id<'groups'>;
const postId = 'post' as Id<'groupPosts'>;
beforeEach(() => {
  vi.clearAllMocks();
  state.group = { joiningQuestionnaire: { canAccessMemberContent: true } };
  state.post = {
    _id: postId,
    groupId,
    title: 'Discussion',
    content: '<script>text</script>',
    authorName: 'Alex',
    createdAt: 1,
    canEdit: true,
    canDelete: true,
  };
  state.posts = { page: [], isDone: true, continueCursor: '' };
});
describe('Group Posts', () => {
  it('gates member content behind current Group onboarding', () => {
    state.group = { joiningQuestionnaire: { canAccessMemberContent: false } };
    render(<GroupPosts groupId={groupId} />);
    expect(
      screen.getByText(/completed required onboarding/)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Posts' })
    ).not.toBeInTheDocument();
  });
  it('renders stored text safely and requires confirmation before deleting', async () => {
    render(<GroupPostDetail groupId={groupId} postId={postId} />);
    expect(screen.getByText('<script>text</script>')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete post' }));
    expect(state.remove).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm deleting post' })
    );
    await waitFor(() => expect(state.remove).toHaveBeenCalledWith({ postId }));
    expect(state.push).toHaveBeenCalledWith('/groups/group');
  });
  it('does not display or manage a post from another Group URL', () => {
    render(
      <GroupPostDetail groupId={'other' as Id<'groups'>} postId={postId} />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Post unavailable');
    expect(
      screen.queryByRole('heading', { name: 'Discussion' })
    ).not.toBeInTheDocument();
  });
  it('creates a post with a labeled form and navigates to its detail', async () => {
    state.create.mockResolvedValue(postId);
    render(<GroupPostEditor groupId={groupId} />);
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'New discussion' },
    });
    fireEvent.change(screen.getByLabelText('Post'), {
      target: { value: 'Ideas welcome' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Publish post' }));
    await waitFor(() =>
      expect(state.create).toHaveBeenCalledWith({
        groupId,
        title: 'New discussion',
        content: 'Ideas welcome',
      })
    );
    expect(state.push).toHaveBeenCalledWith('/groups/group/posts/post');
  });
  it('keeps editor input on failed writes and exposes the error', async () => {
    state.create.mockRejectedValue(new Error('Access changed'));
    render(<GroupPostEditor groupId={groupId} />);
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Retained title' },
    });
    fireEvent.change(screen.getByLabelText('Post'), {
      target: { value: 'Retained text' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Publish post' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Access changed'
    );
    expect(screen.getByLabelText('Post')).toHaveValue('Retained text');
  });
});
