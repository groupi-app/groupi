'use client';

import { api } from '@/convex/_generated/api';
import { createInviteListHooks } from '@groupi/shared/hooks';
import { useMutation, useQuery } from 'convex/react';

export const {
  useInviteLists,
  useInviteList,
  useInviteListPeople,
  useInviteListFriends,
  useInviteListDraftPeople,
  useCreateInviteList,
  useUpdateInviteList,
  useDeleteInviteList,
  useInviteListRecipientReview,
  useSendInviteListRecipients,
} = createInviteListHooks(api, { useQuery, useMutation });
