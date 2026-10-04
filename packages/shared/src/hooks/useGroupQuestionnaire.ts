import type { useMutation, useQuery } from 'convex/react';
import type { FunctionArgs, FunctionReference } from 'convex/server';
export function createGroupQuestionnaireHooks<
  Api extends {
    groupQuestionnaires: {
      queries: {
        getJoiningQuestionnaireAccess: FunctionReference<'query'>;
        getJoiningQuestionnaire: FunctionReference<'query'>;
        listJoiningQuestionnaireAnswers: FunctionReference<'query'>;
        listJoiningQuestionnaireHistory: FunctionReference<'query'>;
      };
      mutations: {
        configureJoiningQuestionnaire: FunctionReference<'mutation'>;
        submitJoiningQuestionnaire: FunctionReference<'mutation'>;
      };
    };
  },
>(
  api: Api,
  hooks: { useQuery: typeof useQuery; useMutation: typeof useMutation }
) {
  const refs = api.groupQuestionnaires;
  function useJoiningQuestionnaire(
    args:
      | FunctionArgs<
          Api['groupQuestionnaires']['queries']['getJoiningQuestionnaire']
        >
      | 'skip'
  ) {
    return hooks.useQuery<
      Api['groupQuestionnaires']['queries']['getJoiningQuestionnaire']
    >(refs.queries.getJoiningQuestionnaire, args);
  }
  function useJoiningQuestionnaireAnswers(
    args:
      | FunctionArgs<
          Api['groupQuestionnaires']['queries']['listJoiningQuestionnaireAnswers']
        >
      | 'skip'
  ) {
    return hooks.useQuery<
      Api['groupQuestionnaires']['queries']['listJoiningQuestionnaireAnswers']
    >(refs.queries.listJoiningQuestionnaireAnswers, args);
  }
  function useJoiningQuestionnaireHistory(
    args:
      | FunctionArgs<
          Api['groupQuestionnaires']['queries']['listJoiningQuestionnaireHistory']
        >
      | 'skip'
  ) {
    return hooks.useQuery<
      Api['groupQuestionnaires']['queries']['listJoiningQuestionnaireHistory']
    >(refs.queries.listJoiningQuestionnaireHistory, args);
  }
  function useConfigureJoiningQuestionnaire() {
    return hooks.useMutation<
      Api['groupQuestionnaires']['mutations']['configureJoiningQuestionnaire']
    >(refs.mutations.configureJoiningQuestionnaire);
  }
  function useSubmitJoiningQuestionnaire() {
    return hooks.useMutation<
      Api['groupQuestionnaires']['mutations']['submitJoiningQuestionnaire']
    >(refs.mutations.submitJoiningQuestionnaire);
  }
  function useJoiningQuestionnaireAccess(
    args:
      | FunctionArgs<
          Api['groupQuestionnaires']['queries']['getJoiningQuestionnaireAccess']
        >
      | 'skip'
  ) {
    return hooks.useQuery<
      Api['groupQuestionnaires']['queries']['getJoiningQuestionnaireAccess']
    >(refs.queries.getJoiningQuestionnaireAccess, args);
  }
  return {
    useJoiningQuestionnaireAccess,
    useJoiningQuestionnaire,
    useJoiningQuestionnaireAnswers,
    useJoiningQuestionnaireHistory,
    useConfigureJoiningQuestionnaire,
    useSubmitJoiningQuestionnaire,
  };
}
