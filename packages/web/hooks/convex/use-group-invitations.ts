'use client';

import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { createGroupInvitationHooks } from '@groupi/shared/hooks';

// Inject the app SDK to retain this app's actual provider context.
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
