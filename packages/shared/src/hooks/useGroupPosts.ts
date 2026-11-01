import type { useQuery, useMutation } from 'convex/react';
import type { FunctionArgs, FunctionReference } from 'convex/server';
export function createGroupPostHooks<
  Api extends {
    groupPosts: {
      queries: {
        listPosts: FunctionReference<'query'>;
        getPost: FunctionReference<'query'>;
        listReplies: FunctionReference<'query'>;
      };
      mutations: {
        createPost: FunctionReference<'mutation'>;
        updatePost: FunctionReference<'mutation'>;
        deletePost: FunctionReference<'mutation'>;
        createReply: FunctionReference<'mutation'>;
        updateReply: FunctionReference<'mutation'>;
        deleteReply: FunctionReference<'mutation'>;
      };
    };
  },
>(
  api: Api,
  hooks: { useQuery: typeof useQuery; useMutation: typeof useMutation }
) {
  function useGroupPosts(
    args: FunctionArgs<Api['groupPosts']['queries']['listPosts']> | 'skip'
  ) {
    return hooks.useQuery<Api['groupPosts']['queries']['listPosts']>(
      api.groupPosts.queries.listPosts,
      args
    );
  }
  function useGroupPost(
    args: FunctionArgs<Api['groupPosts']['queries']['getPost']> | 'skip'
  ) {
    return hooks.useQuery<Api['groupPosts']['queries']['getPost']>(
      api.groupPosts.queries.getPost,
      args
    );
  }
  function useCreateGroupPost() {
    return hooks.useMutation<Api['groupPosts']['mutations']['createPost']>(
      api.groupPosts.mutations.createPost
    );
  }
  function useUpdateGroupPost() {
    return hooks.useMutation<Api['groupPosts']['mutations']['updatePost']>(
      api.groupPosts.mutations.updatePost
    );
  }
  function useDeleteGroupPost() {
    return hooks.useMutation<Api['groupPosts']['mutations']['deletePost']>(
      api.groupPosts.mutations.deletePost
    );
  }
  function useGroupPostReplies(
    args: FunctionArgs<Api['groupPosts']['queries']['listReplies']> | 'skip'
  ) {
    return hooks.useQuery<Api['groupPosts']['queries']['listReplies']>(
      api.groupPosts.queries.listReplies,
      args
    );
  }
  function useCreateGroupPostReply() {
    return hooks.useMutation<Api['groupPosts']['mutations']['createReply']>(
      api.groupPosts.mutations.createReply
    );
  }
  function useUpdateGroupPostReply() {
    return hooks.useMutation<Api['groupPosts']['mutations']['updateReply']>(
      api.groupPosts.mutations.updateReply
    );
  }
  function useDeleteGroupPostReply() {
    return hooks.useMutation<Api['groupPosts']['mutations']['deleteReply']>(
      api.groupPosts.mutations.deleteReply
    );
  }
  return {
    useGroupPostReplies,
    useCreateGroupPostReply,
    useUpdateGroupPostReply,
    useDeleteGroupPostReply,
    useGroupPosts,
    useGroupPost,
    useCreateGroupPost,
    useUpdateGroupPost,
    useDeleteGroupPost,
  };
}
