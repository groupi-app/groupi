import 'tsconfig-paths/register';
import { renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { getFunctionName } from 'convex/server';
import type { Id } from '@/convex/_generated/dataModel';
import { useCreatePost, useUpdatePost, useDeletePost } from './use-posts';
const state = vi.hoisted(() => ({
  optimistic: undefined as
    | ((store: unknown, args: unknown) => void)
    | undefined,
  mutation: vi.fn(),
  toast: vi.fn(),
}));
vi.unmock('@/convex/_generated/api');
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: () =>
    Object.assign(state.mutation, {
      withOptimisticUpdate: (
        callback: (store: unknown, args: unknown) => void
      ) => {
        state.optimistic = callback;
        return state.mutation;
      },
    }),
}));
vi.mock('@/providers/visibility-provider', () => ({ useIsActive: () => true }));
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: state.toast }),
}));
beforeEach(() => {
  vi.clearAllMocks();
  state.optimistic = undefined;
});
const eventId = 'event' as Id<'events'>;
const postId = 'post' as Id<'posts'>;
it.each(['create', 'update', 'delete'] as const)(
  'updates both legacy and pin-excluding Event feed caches on optimistic %s',
  kind => {
    renderHook(() =>
      kind === 'create'
        ? useCreatePost({ personId: 'person' as Id<'persons'> })
        : kind === 'update'
          ? useUpdatePost(eventId)
          : useDeletePost(eventId)
    );
    const original = { _id: postId, title: 'Before', content: 'Original' };
    const saved = new Map<string, { event: { posts: (typeof original)[] } }>();
    const store = {
      getQuery: (ref: Parameters<typeof getFunctionName>[0]) =>
        getFunctionName(ref) === 'posts/queries:getEventPostFeed'
          ? { event: { posts: [original] } }
          : undefined,
      setQuery: (
        ref: Parameters<typeof getFunctionName>[0],
        args: unknown,
        value: { event: { posts: (typeof original)[] } }
      ) => {
        if (getFunctionName(ref) === 'posts/queries:getEventPostFeed')
          saved.set(JSON.stringify(args), value);
      },
    };
    state.optimistic!(store, {
      eventId,
      postId,
      title: 'After',
      content: 'New',
      repliesDisabled: true,
    });
    for (const args of [{ eventId }, { eventId, excludePinned: true }]) {
      const posts = saved.get(JSON.stringify(args))!.event.posts;
      if (kind === 'create') {
        expect(posts).toHaveLength(2);
        expect(posts[0]).toMatchObject({
          title: 'After',
          repliesDisabled: true,
        });
      } else if (kind === 'update')
        expect(posts[0]).toMatchObject({ title: 'After', content: 'New' });
      else expect(posts).toHaveLength(0);
    }
    expect(state.toast).not.toHaveBeenCalled();
  }
);
