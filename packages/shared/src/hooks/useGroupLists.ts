import type { useQuery, useMutation } from 'convex/react';
import type { FunctionArgs, FunctionReference } from 'convex/server';
export function createGroupListHooks<
  Api extends {
    groupLists: {
      queries: {
        getList: FunctionReference<'query'>;
        getListForManagement: FunctionReference<'query'>;
        listLists: FunctionReference<'query'>;
        listEntries: FunctionReference<'query'>;
        getOwnEntries: FunctionReference<'query'>;
      };
      mutations: {
        createList: FunctionReference<'mutation'>;
        configureList: FunctionReference<'mutation'>;
        addEntry: FunctionReference<'mutation'>;
        editEntry: FunctionReference<'mutation'>;
        removeEntry: FunctionReference<'mutation'>;
        deleteList: FunctionReference<'mutation'>;
      };
    };
    groupTools: {
      queries: { getListPolicy: FunctionReference<'query'> };
      mutations: { configureListPolicy: FunctionReference<'mutation'> };
    };
  },
>(
  api: Api,
  hooks: { useQuery: typeof useQuery; useMutation: typeof useMutation }
) {
  function useList(
    args: FunctionArgs<Api['groupLists']['queries']['getList']> | 'skip'
  ) {
    return hooks.useQuery<Api['groupLists']['queries']['getList']>(
      api.groupLists.queries.getList,
      args
    );
  }
  function useListManagement(
    args:
      | FunctionArgs<Api['groupLists']['queries']['getListForManagement']>
      | 'skip'
  ) {
    return hooks.useQuery<Api['groupLists']['queries']['getListForManagement']>(
      api.groupLists.queries.getListForManagement,
      args
    );
  }
  function useLists(
    args: FunctionArgs<Api['groupLists']['queries']['listLists']> | 'skip'
  ) {
    return hooks.useQuery<Api['groupLists']['queries']['listLists']>(
      api.groupLists.queries.listLists,
      args
    );
  }
  function useListEntries(
    args: FunctionArgs<Api['groupLists']['queries']['listEntries']> | 'skip'
  ) {
    return hooks.useQuery<Api['groupLists']['queries']['listEntries']>(
      api.groupLists.queries.listEntries,
      args
    );
  }
  function useOwnListEntries(
    args: FunctionArgs<Api['groupLists']['queries']['getOwnEntries']> | 'skip'
  ) {
    return hooks.useQuery<Api['groupLists']['queries']['getOwnEntries']>(
      api.groupLists.queries.getOwnEntries,
      args
    );
  }
  function useCreateList() {
    return hooks.useMutation<Api['groupLists']['mutations']['createList']>(
      api.groupLists.mutations.createList
    );
  }
  function useConfigureList() {
    return hooks.useMutation<Api['groupLists']['mutations']['configureList']>(
      api.groupLists.mutations.configureList
    );
  }
  function useAddListEntry() {
    return hooks.useMutation<Api['groupLists']['mutations']['addEntry']>(
      api.groupLists.mutations.addEntry
    );
  }
  function useEditListEntry() {
    return hooks.useMutation<Api['groupLists']['mutations']['editEntry']>(
      api.groupLists.mutations.editEntry
    );
  }
  function useRemoveListEntry() {
    return hooks.useMutation<Api['groupLists']['mutations']['removeEntry']>(
      api.groupLists.mutations.removeEntry
    );
  }
  function useDeleteList() {
    return hooks.useMutation<Api['groupLists']['mutations']['deleteList']>(
      api.groupLists.mutations.deleteList
    );
  }
  function useListPolicy(
    args: FunctionArgs<Api['groupTools']['queries']['getListPolicy']> | 'skip'
  ) {
    return hooks.useQuery<Api['groupTools']['queries']['getListPolicy']>(
      api.groupTools.queries.getListPolicy,
      args
    );
  }
  function useConfigureListPolicy() {
    return hooks.useMutation<
      Api['groupTools']['mutations']['configureListPolicy']
    >(api.groupTools.mutations.configureListPolicy);
  }
  return {
    useList,
    useListManagement,
    useLists,
    useListEntries,
    useOwnListEntries,
    useCreateList,
    useConfigureList,
    useAddListEntry,
    useEditListEntry,
    useRemoveListEntry,
    useDeleteList,
    useListPolicy,
    useConfigureListPolicy,
  };
}
