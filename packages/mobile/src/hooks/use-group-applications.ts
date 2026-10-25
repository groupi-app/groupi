import { createGroupApplicationHooks } from '@groupi/shared/hooks';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
export const {
  useGroupApplicationForm,
  useGroupApplication,
  useMyGroupApplications,
  useGroupApplications,
  useConfigureGroupApplications,
  useSubmitGroupApplication,
  useEditGroupApplication,
  useWithdrawGroupApplication,
  useReviewGroupApplication,
} = createGroupApplicationHooks(api, { useQuery, useMutation });
