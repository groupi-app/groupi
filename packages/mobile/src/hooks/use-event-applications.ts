import { createEventApplicationHooks } from '@groupi/shared/hooks';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
export const {
  useApplicationForm,
  useApplicationHistory,
  useApplicationReviewQueue,
  useConfigureApplications,
  useSubmitApplication,
  useWithdrawApplication,
  useDecideApplication,
} = createEventApplicationHooks(api, { useQuery, useMutation });
