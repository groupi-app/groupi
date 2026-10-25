'use client';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { createGroupApplicationHooks } from '@groupi/shared/hooks';
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
