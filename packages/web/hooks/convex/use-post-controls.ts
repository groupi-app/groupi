'use client';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { createPostControlHooks } from '@groupi/shared/hooks';
export const {
  useSetPostRepliesDisabled,
  useSetPostPinned,
  usePinnedEventPosts,
  usePinnedGroupPosts,
} = createPostControlHooks(api, { useQuery, useMutation });
