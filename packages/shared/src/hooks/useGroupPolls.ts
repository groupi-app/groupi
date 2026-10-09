import type { useQuery, useMutation } from 'convex/react';
import type { FunctionArgs, FunctionReference } from 'convex/server';
export function createGroupPollHooks<
  Api extends {
    groupPolls: {
      queries: {
        getPoll: FunctionReference<'query'>;
        getPollForManagement: FunctionReference<'query'>;
        listPolls: FunctionReference<'query'>;
        getOwnHistory: FunctionReference<'query'>;
        listResults: FunctionReference<'query'>;
      };
      mutations: {
        createPoll: FunctionReference<'mutation'>;
        configurePoll: FunctionReference<'mutation'>;
        submitVote: FunctionReference<'mutation'>;
        removeVote: FunctionReference<'mutation'>;
        removeResult: FunctionReference<'mutation'>;
        deletePoll: FunctionReference<'mutation'>;
      };
    };
    groupTools: {
      queries: { getPollPolicy: FunctionReference<'query'> };
      mutations: { configurePollPolicy: FunctionReference<'mutation'> };
    };
  },
>(
  api: Api,
  hooks: { useQuery: typeof useQuery; useMutation: typeof useMutation }
) {
  function usePoll(
    args: FunctionArgs<Api['groupPolls']['queries']['getPoll']> | 'skip'
  ) {
    return hooks.useQuery<Api['groupPolls']['queries']['getPoll']>(
      api.groupPolls.queries.getPoll,
      args
    );
  }
  function usePollManagement(
    args:
      | FunctionArgs<Api['groupPolls']['queries']['getPollForManagement']>
      | 'skip'
  ) {
    return hooks.useQuery<Api['groupPolls']['queries']['getPollForManagement']>(
      api.groupPolls.queries.getPollForManagement,
      args
    );
  }
  function usePolls(
    args: FunctionArgs<Api['groupPolls']['queries']['listPolls']> | 'skip'
  ) {
    return hooks.useQuery<Api['groupPolls']['queries']['listPolls']>(
      api.groupPolls.queries.listPolls,
      args
    );
  }
  function usePollHistory(
    args: FunctionArgs<Api['groupPolls']['queries']['getOwnHistory']> | 'skip'
  ) {
    return hooks.useQuery<Api['groupPolls']['queries']['getOwnHistory']>(
      api.groupPolls.queries.getOwnHistory,
      args
    );
  }
  function usePollResults(
    args: FunctionArgs<Api['groupPolls']['queries']['listResults']> | 'skip'
  ) {
    return hooks.useQuery<Api['groupPolls']['queries']['listResults']>(
      api.groupPolls.queries.listResults,
      args
    );
  }
  function useCreatePoll() {
    return hooks.useMutation<Api['groupPolls']['mutations']['createPoll']>(
      api.groupPolls.mutations.createPoll
    );
  }
  function useConfigurePoll() {
    return hooks.useMutation<Api['groupPolls']['mutations']['configurePoll']>(
      api.groupPolls.mutations.configurePoll
    );
  }
  function useSubmitPollVote() {
    return hooks.useMutation<Api['groupPolls']['mutations']['submitVote']>(
      api.groupPolls.mutations.submitVote
    );
  }
  function useRemovePollVote() {
    return hooks.useMutation<Api['groupPolls']['mutations']['removeVote']>(
      api.groupPolls.mutations.removeVote
    );
  }
  function useRemovePollResult() {
    return hooks.useMutation<Api['groupPolls']['mutations']['removeResult']>(
      api.groupPolls.mutations.removeResult
    );
  }
  function useDeletePoll() {
    return hooks.useMutation<Api['groupPolls']['mutations']['deletePoll']>(
      api.groupPolls.mutations.deletePoll
    );
  }
  function usePollPolicy(
    args: FunctionArgs<Api['groupTools']['queries']['getPollPolicy']> | 'skip'
  ) {
    return hooks.useQuery<Api['groupTools']['queries']['getPollPolicy']>(
      api.groupTools.queries.getPollPolicy,
      args
    );
  }
  function useConfigurePollPolicy() {
    return hooks.useMutation<
      Api['groupTools']['mutations']['configurePollPolicy']
    >(api.groupTools.mutations.configurePollPolicy);
  }
  return {
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
  };
}
