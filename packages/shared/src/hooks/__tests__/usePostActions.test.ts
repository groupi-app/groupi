import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConvexId, PostActionApi } from '../types';
import { createPostActionHooks } from '../usePostActions';

const mockUseMutation = vi.fn((mutation: unknown) => mutation);

vi.mock('convex/react', () => ({
  useMutation: (mutation: unknown) => mockUseMutation(mutation),
}));

vi.mock('react', () => ({
  useCallback: <Callback>(callback: Callback) => callback,
}));

describe('createPostActionHooks', () => {
  const postMutations = {
    createPost: { name: 'posts.createPost' },
    updatePost: { name: 'posts.updatePost' },
    deletePost: { name: 'posts.deletePost' },
  };
  const replyMutations = {
    createReply: { name: 'replies.createReply' },
    updateReply: { name: 'replies.updateReply' },
    deleteReply: { name: 'replies.deleteReply' },
  };
  const api = {
    posts: { mutations: postMutations },
    replies: { mutations: replyMutations },
  } as unknown as PostActionApi;

  beforeEach(() => {
    mockUseMutation.mockClear();
    mockUseMutation.mockImplementation((mutation: unknown) => mutation);
  });

  it('uses the posts mutation module for post actions', () => {
    const hooks = createPostActionHooks(api);

    expect(hooks.useCreatePost()).toBe(postMutations.createPost);
    expect(hooks.useUpdatePost()).toBe(postMutations.updatePost);
    expect(hooks.useDeletePost()).toBe(postMutations.deletePost);
  });

  it('uses the replies mutation module for reply actions', () => {
    const hooks = createPostActionHooks(api);

    expect(hooks.useCreateReply()).toBe(replyMutations.createReply);
    expect(hooks.useUpdateReply()).toBe(replyMutations.updateReply);
    expect(hooks.useDeleteReply()).toBe(replyMutations.deleteReply);
  });

  it('binds reply text to the generated reply mutation payload', async () => {
    const createReply = vi.fn().mockResolvedValue({ replyId: 'reply-1' });
    mockUseMutation.mockImplementation((mutation: unknown) =>
      mutation === replyMutations.createReply ? createReply : vi.fn()
    );
    const hooks = createPostActionHooks(api);
    const actions = hooks.usePostActions('post-1' as ConvexId<'posts'>);

    await actions.createReply({ text: 'Hello' });

    expect(createReply).toHaveBeenCalledWith({
      postId: 'post-1',
      text: 'Hello',
    });
  });
});
