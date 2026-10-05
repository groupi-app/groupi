'use client';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { createGroupPollHooks } from '@groupi/shared/hooks';
export const {
  usePoll,
  usePollManagement,
  usePolls,
  usePollHistory,
  usePollResults,
  useCreatePoll,
  useConfigurePoll,
  useSubmitPollVote,
  useRemovePollVote,
  useRemovePollResult,
  useDeletePoll,
  usePollPolicy,
  useConfigurePollPolicy,
} = createGroupPollHooks(api, { useQuery, useMutation });
