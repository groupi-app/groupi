import type { useMutation, useQuery } from 'convex/react';
import type { FunctionArgs, FunctionReference } from 'convex/server';
export function createEventApplicationHooks<
  Api extends {
    eventApplications: {
      queries: {
        getForm: FunctionReference<'query'>;
        history: FunctionReference<'query'>;
        list: FunctionReference<'query'>;
      };
      mutations: {
        configure: FunctionReference<'mutation'>;
        submit: FunctionReference<'mutation'>;
        withdraw: FunctionReference<'mutation'>;
        decide: FunctionReference<'mutation'>;
      };
    };
  },
>(
  api: Api,
  hooks: { useQuery: typeof useQuery; useMutation: typeof useMutation }
) {
  const refs = api.eventApplications;
  function useApplicationForm(
    args: FunctionArgs<Api['eventApplications']['queries']['getForm']> | 'skip'
  ) {
    return hooks.useQuery<Api['eventApplications']['queries']['getForm']>(
      refs.queries.getForm,
      args
    );
  }
  function useApplicationHistory(
    args: FunctionArgs<Api['eventApplications']['queries']['history']> | 'skip'
  ) {
    return hooks.useQuery<Api['eventApplications']['queries']['history']>(
      refs.queries.history,
      args
    );
  }
  function useApplicationReviewQueue(
    args: FunctionArgs<Api['eventApplications']['queries']['list']> | 'skip'
  ) {
    return hooks.useQuery<Api['eventApplications']['queries']['list']>(
      refs.queries.list,
      args
    );
  }
  function useConfigureApplications() {
    return hooks.useMutation<
      Api['eventApplications']['mutations']['configure']
    >(refs.mutations.configure);
  }
  function useSubmitApplication() {
    return hooks.useMutation<Api['eventApplications']['mutations']['submit']>(
      refs.mutations.submit
    );
  }
  function useWithdrawApplication() {
    return hooks.useMutation<Api['eventApplications']['mutations']['withdraw']>(
      refs.mutations.withdraw
    );
  }
  function useDecideApplication() {
    return hooks.useMutation<Api['eventApplications']['mutations']['decide']>(
      refs.mutations.decide
    );
  }
  return {
    useApplicationForm,
    useApplicationHistory,
    useApplicationReviewQueue,
    useConfigureApplications,
    useSubmitApplication,
    useWithdrawApplication,
    useDecideApplication,
  };
}
