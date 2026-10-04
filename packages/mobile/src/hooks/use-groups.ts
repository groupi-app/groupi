import { createGroupHooks } from '@groupi/shared/hooks';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';

export const {
  useGroups,
  useGroup,
  useGroupLanding,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
} = createGroupHooks(api, { useQuery, useMutation });
