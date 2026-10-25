'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { createGroupModerationHooks } from '@groupi/shared/hooks';

export const {
  useSetGroupMemberRole,
  useRemoveGroupMember,
  useBanGroupPerson,
  useLiftGroupBan,
  useLeaveGroup,
  useGroupBans,
} = createGroupModerationHooks(api, { useQuery, useMutation });
