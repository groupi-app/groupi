import type { useQuery, useMutation } from 'convex/react';
import type { FunctionArgs, FunctionReference } from 'convex/server';
/** Parent-authorized post state actions, bound to each application's Convex SDK. */
export function createPostControlHooks<
  Api extends {
    posts: {
      queries: { getPinnedEventPosts: FunctionReference<'query'> };
      mutations: {
        setRepliesDisabled: FunctionReference<'mutation'>;
        setPinned: FunctionReference<'mutation'>;
      };
    };
    groupPosts: { queries: { listPinnedPosts: FunctionReference<'query'> } };
  },
>(
  api: Api,
  hooks: { useQuery: typeof useQuery; useMutation: typeof useMutation }
) {
  function useSetPostRepliesDisabled() {
    return hooks.useMutation<Api['posts']['mutations']['setRepliesDisabled']>(
      api.posts.mutations.setRepliesDisabled
    );
  }
  function useSetPostPinned() {
    return hooks.useMutation<Api['posts']['mutations']['setPinned']>(
      api.posts.mutations.setPinned
    );
  }
  function usePinnedEventPosts(
    args: FunctionArgs<Api['posts']['queries']['getPinnedEventPosts']> | 'skip'
  ) {
    return hooks.useQuery<Api['posts']['queries']['getPinnedEventPosts']>(
      api.posts.queries.getPinnedEventPosts,
      args
    );
  }
  function usePinnedGroupPosts(
    args: FunctionArgs<Api['groupPosts']['queries']['listPinnedPosts']> | 'skip'
  ) {
    return hooks.useQuery<Api['groupPosts']['queries']['listPinnedPosts']>(
      api.groupPosts.queries.listPinnedPosts,
      args
    );
  }
  return {
    useSetPostRepliesDisabled,
    useSetPostPinned,
    usePinnedEventPosts,
    usePinnedGroupPosts,
  };
}
