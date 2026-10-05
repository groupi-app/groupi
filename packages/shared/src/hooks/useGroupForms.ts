import type { useQuery, useMutation } from 'convex/react';
import type { FunctionArgs, FunctionReference } from 'convex/server';
export function createGroupFormHooks<
  Api extends {
    groupForms: {
      queries: {
        getForm: FunctionReference<'query'>;
        listForms: FunctionReference<'query'>;
        getOwnHistory: FunctionReference<'query'>;
        listResults: FunctionReference<'query'>;
      };
      mutations: {
        createForm: FunctionReference<'mutation'>;
        configureForm: FunctionReference<'mutation'>;
        submitResponse: FunctionReference<'mutation'>;
        removeResponse: FunctionReference<'mutation'>;
        removeResult: FunctionReference<'mutation'>;
        deleteForm: FunctionReference<'mutation'>;
      };
    };
    groupTools: {
      queries: { getFormPolicy: FunctionReference<'query'> };
      mutations: { configureFormPolicy: FunctionReference<'mutation'> };
    };
  },
>(
  api: Api,
  hooks: { useQuery: typeof useQuery; useMutation: typeof useMutation }
) {
  function useForm(
    args: FunctionArgs<Api['groupForms']['queries']['getForm']> | 'skip'
  ) {
    return hooks.useQuery<Api['groupForms']['queries']['getForm']>(
      api.groupForms.queries.getForm,
      args
    );
  }
  function useForms(
    args: FunctionArgs<Api['groupForms']['queries']['listForms']> | 'skip'
  ) {
    return hooks.useQuery<Api['groupForms']['queries']['listForms']>(
      api.groupForms.queries.listForms,
      args
    );
  }
  function useFormHistory(
    args: FunctionArgs<Api['groupForms']['queries']['getOwnHistory']> | 'skip'
  ) {
    return hooks.useQuery<Api['groupForms']['queries']['getOwnHistory']>(
      api.groupForms.queries.getOwnHistory,
      args
    );
  }
  function useFormResults(
    args: FunctionArgs<Api['groupForms']['queries']['listResults']> | 'skip'
  ) {
    return hooks.useQuery<Api['groupForms']['queries']['listResults']>(
      api.groupForms.queries.listResults,
      args
    );
  }
  function useCreateForm() {
    return hooks.useMutation<Api['groupForms']['mutations']['createForm']>(
      api.groupForms.mutations.createForm
    );
  }
  function useConfigureForm() {
    return hooks.useMutation<Api['groupForms']['mutations']['configureForm']>(
      api.groupForms.mutations.configureForm
    );
  }
  function useSubmitFormResponse() {
    return hooks.useMutation<Api['groupForms']['mutations']['submitResponse']>(
      api.groupForms.mutations.submitResponse
    );
  }
  function useRemoveFormResponse() {
    return hooks.useMutation<Api['groupForms']['mutations']['removeResponse']>(
      api.groupForms.mutations.removeResponse
    );
  }
  function useRemoveFormResult() {
    return hooks.useMutation<Api['groupForms']['mutations']['removeResult']>(
      api.groupForms.mutations.removeResult
    );
  }
  function useDeleteForm() {
    return hooks.useMutation<Api['groupForms']['mutations']['deleteForm']>(
      api.groupForms.mutations.deleteForm
    );
  }
  function useFormPolicy(
    args: FunctionArgs<Api['groupTools']['queries']['getFormPolicy']> | 'skip'
  ) {
    return hooks.useQuery<Api['groupTools']['queries']['getFormPolicy']>(
      api.groupTools.queries.getFormPolicy,
      args
    );
  }
  function useConfigureFormPolicy() {
    return hooks.useMutation<
      Api['groupTools']['mutations']['configureFormPolicy']
    >(api.groupTools.mutations.configureFormPolicy);
  }
  return {
    useForm,
    useForms,
    useFormHistory,
    useFormResults,
    useCreateForm,
    useConfigureForm,
    useSubmitFormResponse,
    useRemoveFormResponse,
    useRemoveFormResult,
    useDeleteForm,
    useFormPolicy,
    useConfigureFormPolicy,
  };
}
