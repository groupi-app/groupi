import type { useQuery, useMutation, ReactMutation } from 'convex/react';
import type { FunctionReference, FunctionReturnType } from 'convex/server';
import type { ConvexId } from './types';

interface GroupApi {
  groups: {
    queries: {
      listGroups: FunctionReference<'query'>;
      getGroup: FunctionReference<'query'>;
      getGroupLanding: FunctionReference<'query'>;
    };
    mutations: {
      createGroup: FunctionReference<'mutation'>;
      updateGroup: FunctionReference<'mutation'>;
      deleteGroup: FunctionReference<'mutation'>;
    };
  };
}

/** Bind the consuming app's SDK hooks so each hook uses its actual provider. */
export function createGroupHooks<Api extends GroupApi>(
  api: Api,
  hooks: { useQuery: typeof useQuery; useMutation: typeof useMutation }
) {
  function useGroups(
    paginationOpts: { numItems: number; cursor: string | null } = {
      numItems: 20,
      cursor: null,
    }
  ) {
    return hooks.useQuery(api.groups.queries.listGroups, { paginationOpts }) as
      | FunctionReturnType<Api['groups']['queries']['listGroups']>
      | undefined;
  }
  function useGroup(groupId: ConvexId<'groups'>) {
    return hooks.useQuery(api.groups.queries.getGroup, { groupId }) as
      | FunctionReturnType<Api['groups']['queries']['getGroup']>
      | undefined;
  }
  function useGroupLanding(groupId: ConvexId<'groups'>) {
    return hooks.useQuery(api.groups.queries.getGroupLanding, { groupId }) as
      | FunctionReturnType<Api['groups']['queries']['getGroupLanding']>
      | undefined;
  }
  function useCreateGroup() {
    return hooks.useMutation(api.groups.mutations.createGroup) as ReactMutation<
      Api['groups']['mutations']['createGroup']
    >;
  }
  function useUpdateGroup() {
    return hooks.useMutation(api.groups.mutations.updateGroup) as ReactMutation<
      Api['groups']['mutations']['updateGroup']
    >;
  }
  function useDeleteGroup() {
    return hooks.useMutation(api.groups.mutations.deleteGroup) as ReactMutation<
      Api['groups']['mutations']['deleteGroup']
    >;
  }
  return {
    useGroups,
    useGroup,
    useGroupLanding,
    useCreateGroup,
    useUpdateGroup,
    useDeleteGroup,
  };
}
