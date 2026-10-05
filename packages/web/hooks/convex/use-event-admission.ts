'use client';

import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { createEventAdmissionHooks } from '@groupi/shared/hooks';

// Use the app SDK instance so shared hooks retain the app's provider context.
export const {
  useEventLogistics,
  useUpdateAdmissionPolicy,
  useJoinEvent,
  useDiscoverableEvents,
} = createEventAdmissionHooks(api, { useQuery, useMutation });
