import type { useQuery, useMutation } from 'convex/react';
import type { FunctionReference, FunctionArgs } from 'convex/server';
interface GroupApplicationApi {
  groupApplications: {
    queries: {
      getGroupApplicationForm: FunctionReference<'query'>;
      getGroupApplication: FunctionReference<'query'>;
      listMyGroupApplications: FunctionReference<'query'>;
      listGroupApplications: FunctionReference<'query'>;
    };
    mutations: {
      configureGroupApplications: FunctionReference<'mutation'>;
      submitGroupApplication: FunctionReference<'mutation'>;
      editGroupApplication: FunctionReference<'mutation'>;
      withdrawGroupApplication: FunctionReference<'mutation'>;
      reviewGroupApplication: FunctionReference<'mutation'>;
    };
  };
}
export function createGroupApplicationHooks<Api extends GroupApplicationApi>(
  api: Api,
  hooks: { useQuery: typeof useQuery; useMutation: typeof useMutation }
) {
  const refs = api.groupApplications;
  function useGroupApplicationForm(
    args:
      | FunctionArgs<
          Api['groupApplications']['queries']['getGroupApplicationForm']
        >
      | 'skip'
  ) {
    return hooks.useQuery<
      Api['groupApplications']['queries']['getGroupApplicationForm']
    >(refs.queries.getGroupApplicationForm, args);
  }
  function useGroupApplication(
    args:
      | FunctionArgs<Api['groupApplications']['queries']['getGroupApplication']>
      | 'skip'
  ) {
    return hooks.useQuery<
      Api['groupApplications']['queries']['getGroupApplication']
    >(refs.queries.getGroupApplication, args);
  }
  function useMyGroupApplications(
    args:
      | FunctionArgs<
          Api['groupApplications']['queries']['listMyGroupApplications']
        >
      | 'skip'
  ) {
    return hooks.useQuery<
      Api['groupApplications']['queries']['listMyGroupApplications']
    >(refs.queries.listMyGroupApplications, args);
  }
  function useGroupApplications(
    args:
      | FunctionArgs<
          Api['groupApplications']['queries']['listGroupApplications']
        >
      | 'skip'
  ) {
    return hooks.useQuery<
      Api['groupApplications']['queries']['listGroupApplications']
    >(refs.queries.listGroupApplications, args);
  }
  function useConfigureGroupApplications() {
    return hooks.useMutation<
      Api['groupApplications']['mutations']['configureGroupApplications']
    >(refs.mutations.configureGroupApplications);
  }
  function useSubmitGroupApplication() {
    return hooks.useMutation<
      Api['groupApplications']['mutations']['submitGroupApplication']
    >(refs.mutations.submitGroupApplication);
  }
  function useEditGroupApplication() {
    return hooks.useMutation<
      Api['groupApplications']['mutations']['editGroupApplication']
    >(refs.mutations.editGroupApplication);
  }
  function useWithdrawGroupApplication() {
    return hooks.useMutation<
      Api['groupApplications']['mutations']['withdrawGroupApplication']
    >(refs.mutations.withdrawGroupApplication);
  }
  function useReviewGroupApplication() {
    return hooks.useMutation<
      Api['groupApplications']['mutations']['reviewGroupApplication']
    >(refs.mutations.reviewGroupApplication);
  }
  return {
    useGroupApplicationForm,
    useGroupApplication,
    useMyGroupApplications,
    useGroupApplications,
    useConfigureGroupApplications,
    useSubmitGroupApplication,
    useEditGroupApplication,
    useWithdrawGroupApplication,
    useReviewGroupApplication,
  };
}
