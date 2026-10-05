import { createGroupEventAudienceHooks } from '@groupi/shared/hooks';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
export const {
  useEventAudiences,
  useGroupSharedEvents,
  useShareEventWithGroup,
  useWithdrawGroupEventAudience,
  useConfigureGroupEventSharing,
  useSetEventFriendsAudience,
} = createGroupEventAudienceHooks(api, { useQuery, useMutation });
