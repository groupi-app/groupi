'use client';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { createEventApplicationHooks } from '@groupi/shared/hooks';
export const {
  useApplicationForm,
  useApplicationHistory,
  useApplicationReviewQueue,
  useConfigureApplications,
  useSubmitApplication,
  useWithdrawApplication,
  useDecideApplication,
} = createEventApplicationHooks(api, { useQuery, useMutation });
