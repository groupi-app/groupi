'use client';

import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { createGroupHooks } from '@groupi/shared/hooks';

// Bind the app's SDK instance so these hooks share its Convex provider.
export const {
  useGroups,
  useGroup,
  useGroupLanding,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
} = createGroupHooks(api, { useQuery, useMutation });
