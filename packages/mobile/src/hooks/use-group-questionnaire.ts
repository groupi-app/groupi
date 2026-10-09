import { createGroupQuestionnaireHooks } from '@groupi/shared/hooks';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
export const {
  useJoiningQuestionnaire,
  useJoiningQuestionnaireAnswers,
  useJoiningQuestionnaireHistory,
  useConfigureJoiningQuestionnaire,
  useSubmitJoiningQuestionnaire,
} = createGroupQuestionnaireHooks(api, { useQuery, useMutation });
