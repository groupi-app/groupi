import type { useQuery, useMutation, ReactMutation } from 'convex/react';
import type { FunctionReference, FunctionReturnType } from 'convex/server';
import type { ConvexId } from './types';
interface GroupModerationApi {
  groupModeration: {
    queries: { listGroupBans: FunctionReference<'query'> };
    mutations: {
      setGroupMemberRole: FunctionReference<'mutation'>;
      removeGroupMember: FunctionReference<'mutation'>;
      banGroupPerson: FunctionReference<'mutation'>;
      liftGroupBan: FunctionReference<'mutation'>;
      leaveGroup: FunctionReference<'mutation'>;
    };
  };
}
export function createGroupModerationHooks<Api extends GroupModerationApi>(
  api: Api,
  hooks: { useQuery: typeof useQuery; useMutation: typeof useMutation }
) {
  function useGroupBans(
    groupId: ConvexId<'groups'>,
    paginationOpts = { numItems: 20, cursor: null as string | null }
  ) {
    return hooks.useQuery(api.groupModeration.queries.listGroupBans, {
      groupId,
      paginationOpts,
    }) as
      | FunctionReturnType<Api['groupModeration']['queries']['listGroupBans']>
      | undefined;
  }
  function useSetGroupMemberRole() {
    return hooks.useMutation(
      api.groupModeration.mutations.setGroupMemberRole
    ) as ReactMutation<
      Api['groupModeration']['mutations']['setGroupMemberRole']
    >;
  }
  function useRemoveGroupMember() {
    return hooks.useMutation(
      api.groupModeration.mutations.removeGroupMember
    ) as ReactMutation<
      Api['groupModeration']['mutations']['removeGroupMember']
    >;
  }
  function useBanGroupPerson() {
    return hooks.useMutation(
      api.groupModeration.mutations.banGroupPerson
    ) as ReactMutation<Api['groupModeration']['mutations']['banGroupPerson']>;
  }
  function useLiftGroupBan() {
    return hooks.useMutation(
      api.groupModeration.mutations.liftGroupBan
    ) as ReactMutation<Api['groupModeration']['mutations']['liftGroupBan']>;
  }
  function useLeaveGroup() {
    return hooks.useMutation(
      api.groupModeration.mutations.leaveGroup
    ) as ReactMutation<Api['groupModeration']['mutations']['leaveGroup']>;
  }
  return {
    useGroupBans,
    useSetGroupMemberRole,
    useRemoveGroupMember,
    useBanGroupPerson,
    useLiftGroupBan,
    useLeaveGroup,
  };
}
