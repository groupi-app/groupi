import {
  createPostDataHooks,
  createPostActionHooks,
} from '@groupi/shared/hooks';

// Lazy-load API to avoid deep type instantiation issues
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

const postDataHooks = createPostDataHooks(api);
const postActionHooks = createPostActionHooks(api);

export const {
  usePostDetail,
  useEventPostFeed,
  usePostReplies,
  usePost,
  useCanManagePost,
  usePostLoadingStates,
} = postDataHooks;

export const {
  useCreatePost,
  useUpdatePost,
  useDeletePost,
  useCreateReply,
  useUpdateReply,
  useDeleteReply,
  usePostActions,
  useReplyActions,
  useEventPostActions,
  usePostManagement,
} = postActionHooks;
