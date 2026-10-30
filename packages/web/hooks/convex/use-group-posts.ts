import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { createGroupPostHooks } from '@groupi/shared/hooks';
export const {
  useGroupPostReplies,
  useCreateGroupPostReply,
  useUpdateGroupPostReply,
  useDeleteGroupPostReply,
  useGroupPosts,
  useGroupPost,
  useCreateGroupPost,
  useUpdateGroupPost,
  useDeleteGroupPost,
} = createGroupPostHooks(api, { useQuery, useMutation });
