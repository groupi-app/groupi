'use client';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { createGroupQuestionnaireHooks } from '@groupi/shared/hooks';

export const {
  useJoiningQuestionnaire,
  useJoiningQuestionnaireAccess,
  useJoiningQuestionnaireAnswers,
  useJoiningQuestionnaireHistory,
  useConfigureJoiningQuestionnaire,
  useSubmitJoiningQuestionnaire,
} = createGroupQuestionnaireHooks(api, { useQuery, useMutation });
