import { createGroupInvitationHooks } from '@groupi/shared/hooks';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';

export const {
  useMyGroupInvites,
  useGroupInvites,
  useMyGroupInviteForGroup,
  useGroupMembers,
  useSendGroupInvite,
  useAcceptGroupInvite,
  useDeclineGroupInvite,
  useCancelGroupInvite,
  useUpdateGroupInvitationPolicy,
} = createGroupInvitationHooks(api, { useQuery, useMutation });
