import type { useQuery, useMutation } from 'convex/react';
import type { FunctionReference } from 'convex/server';
import type { ConvexId } from './types';
interface GroupModerationApi<
  ListGroupBansResult,
  SetGroupMemberRoleMutation extends FunctionReference<'mutation'>,
  RemoveGroupMemberMutation extends FunctionReference<'mutation'>,
  BanGroupPersonMutation extends FunctionReference<'mutation'>,
  LiftGroupBanMutation extends FunctionReference<'mutation'>,
  LeaveGroupMutation extends FunctionReference<'mutation'>,
> {
  groupModeration: {
    queries: {
      listGroupBans: FunctionReference<
        'query',
        'public',
        {
          groupId: ConvexId<'groups'>;
          paginationOpts: { numItems: number; cursor: string | null };
        },
        ListGroupBansResult
      >;
    };
    mutations: {
      setGroupMemberRole: SetGroupMemberRoleMutation;
      removeGroupMember: RemoveGroupMemberMutation;
      banGroupPerson: BanGroupPersonMutation;
      liftGroupBan: LiftGroupBanMutation;
      leaveGroup: LeaveGroupMutation;
    };
  };
}
export function createGroupModerationHooks<
  ListGroupBansResult,
  SetGroupMemberRoleMutation extends FunctionReference<'mutation'>,
  RemoveGroupMemberMutation extends FunctionReference<'mutation'>,
  BanGroupPersonMutation extends FunctionReference<'mutation'>,
  LiftGroupBanMutation extends FunctionReference<'mutation'>,
  LeaveGroupMutation extends FunctionReference<'mutation'>,
>(
  api: GroupModerationApi<
    ListGroupBansResult,
    SetGroupMemberRoleMutation,
    RemoveGroupMemberMutation,
    BanGroupPersonMutation,
    LiftGroupBanMutation,
    LeaveGroupMutation
  >,
  hooks: { useQuery: typeof useQuery; useMutation: typeof useMutation }
) {
  function useGroupBans(
    groupId: ConvexId<'groups'>,
    paginationOpts: { numItems: number; cursor: string | null } = {
      numItems: 20,
      cursor: null,
    }
  ) {
    return hooks.useQuery(api.groupModeration.queries.listGroupBans, {
      groupId,
      paginationOpts,
    });
  }
  function useSetGroupMemberRole() {
    return hooks.useMutation<SetGroupMemberRoleMutation>(
      api.groupModeration.mutations.setGroupMemberRole
    );
  }
  function useRemoveGroupMember() {
    return hooks.useMutation<RemoveGroupMemberMutation>(
      api.groupModeration.mutations.removeGroupMember
    );
  }
  function useBanGroupPerson() {
    return hooks.useMutation<BanGroupPersonMutation>(
      api.groupModeration.mutations.banGroupPerson
    );
  }
  function useLiftGroupBan() {
    return hooks.useMutation<LiftGroupBanMutation>(
      api.groupModeration.mutations.liftGroupBan
    );
  }
  function useLeaveGroup() {
    return hooks.useMutation<LeaveGroupMutation>(
      api.groupModeration.mutations.leaveGroup
    );
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
