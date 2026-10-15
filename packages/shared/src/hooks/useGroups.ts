import type { useQuery, useMutation } from 'convex/react';
import type { FunctionReference } from 'convex/server';
import type { ConvexId } from './types';

interface GroupApi<
  ListGroupsResult,
  GetGroupResult,
  GetGroupLandingResult,
  CreateGroupMutation extends FunctionReference<'mutation'>,
  UpdateGroupMutation extends FunctionReference<'mutation'>,
  DeleteGroupMutation extends FunctionReference<'mutation'>,
> {
  groups: {
    queries: {
      listGroups: FunctionReference<
        'query',
        'public',
        { paginationOpts: { numItems: number; cursor: string | null } },
        ListGroupsResult
      >;
      getGroup: FunctionReference<
        'query',
        'public',
        { groupId: ConvexId<'groups'> },
        GetGroupResult
      >;
      getGroupLanding: FunctionReference<
        'query',
        'public',
        { groupId: ConvexId<'groups'> },
        GetGroupLandingResult
      >;
    };
    mutations: {
      createGroup: CreateGroupMutation;
      updateGroup: UpdateGroupMutation;
      deleteGroup: DeleteGroupMutation;
    };
  };
}

/** Bind the consuming app's SDK hooks so each hook uses its actual provider. */
export function createGroupHooks<
  ListGroupsResult,
  GetGroupResult,
  GetGroupLandingResult,
  CreateGroupMutation extends FunctionReference<'mutation'>,
  UpdateGroupMutation extends FunctionReference<'mutation'>,
  DeleteGroupMutation extends FunctionReference<'mutation'>,
>(
  api: GroupApi<
    ListGroupsResult,
    GetGroupResult,
    GetGroupLandingResult,
    CreateGroupMutation,
    UpdateGroupMutation,
    DeleteGroupMutation
  >,
  hooks: { useQuery: typeof useQuery; useMutation: typeof useMutation }
) {
  function useGroups(
    paginationOpts: { numItems: number; cursor: string | null } = {
      numItems: 20,
      cursor: null,
    }
  ) {
    return hooks.useQuery(api.groups.queries.listGroups, { paginationOpts });
  }
  function useGroup(groupId: ConvexId<'groups'>) {
    return hooks.useQuery(api.groups.queries.getGroup, { groupId });
  }
  function useGroupLanding(groupId: ConvexId<'groups'>) {
    return hooks.useQuery(api.groups.queries.getGroupLanding, { groupId });
  }
  function useCreateGroup() {
    return hooks.useMutation<CreateGroupMutation>(
      api.groups.mutations.createGroup
    );
  }
  function useUpdateGroup() {
    return hooks.useMutation<UpdateGroupMutation>(
      api.groups.mutations.updateGroup
    );
  }
  function useDeleteGroup() {
    return hooks.useMutation<DeleteGroupMutation>(
      api.groups.mutations.deleteGroup
    );
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
