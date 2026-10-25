import { createEventAdmissionHooks } from '@groupi/shared/hooks';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';

export const {
  useEventLogistics,
  useUpdateAdmissionPolicy,
  useJoinEvent,
  useDiscoverableEvents,
} = createEventAdmissionHooks(api, { useQuery, useMutation });
