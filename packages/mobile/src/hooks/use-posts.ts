import {
  createPostDataHooks,
  createPostActionHooks,
} from '@groupi/shared/hooks';
import { api } from 'convex/_generated/api';

const postDataHooks = createPostDataHooks(api);
const postActionHooks = createPostActionHooks(api);

export const {
  usePostDetail,
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
