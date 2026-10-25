'use client';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { createGroupEventAudienceHooks } from '@groupi/shared/hooks';
export const {
  useEventAudiences,
  useGroupSharedEvents,
  useShareEventWithGroup,
  useWithdrawGroupEventAudience,
  useConfigureGroupEventSharing,
  useSetEventFriendsAudience,
} = createGroupEventAudienceHooks(api, { useQuery, useMutation });
