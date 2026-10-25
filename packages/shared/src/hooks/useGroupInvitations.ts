import type { useMutation, useQuery } from 'convex/react';
import type { FunctionReference } from 'convex/server';
import type { ConvexId } from './types';
interface GroupInvitationApi<
  ListMyGroupInvitesResult,
  ListGroupInvitesResult,
  GetMyGroupInviteForGroupResult,
  ListGroupMembersResult,
  SendGroupInviteMutation extends FunctionReference<'mutation'>,
  AcceptGroupInviteMutation extends FunctionReference<'mutation'>,
  DeclineGroupInviteMutation extends FunctionReference<'mutation'>,
  CancelGroupInviteMutation extends FunctionReference<'mutation'>,
  UpdateGroupInvitationPolicyMutation extends FunctionReference<'mutation'>,
> {
  groupInvites: {
    queries: {
      listMyGroupInvites: FunctionReference<
        'query',
        'public',
        {
          paginationOpts: { numItems: number; cursor: string | null };
          status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
        },
        ListMyGroupInvitesResult
      >;
      listGroupInvites: FunctionReference<
        'query',
        'public',
        {
          groupId: ConvexId<'groups'>;
          paginationOpts: { numItems: number; cursor: string | null };
          status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
        },
        ListGroupInvitesResult
      >;
      getMyGroupInviteForGroup: FunctionReference<
        'query',
        'public',
        { groupId: ConvexId<'groups'> },
        GetMyGroupInviteForGroupResult
      >;
    };
    mutations: {
      sendGroupInvite: SendGroupInviteMutation;
      acceptGroupInvite: AcceptGroupInviteMutation;
      declineGroupInvite: DeclineGroupInviteMutation;
      cancelGroupInvite: CancelGroupInviteMutation;
    };
  };
  groups: {
    queries: {
      listGroupMembers: FunctionReference<
        'query',
        'public',
        {
          groupId: ConvexId<'groups'>;
          paginationOpts: { numItems: number; cursor: string | null };
        },
        ListGroupMembersResult
      >;
    };
    mutations: {
      updateGroupInvitationPolicy: UpdateGroupInvitationPolicyMutation;
    };
  };
}
/** Uses only the consuming app's SDK, preserving its provider identity. */
export function createGroupInvitationHooks<
  ListMyGroupInvitesResult,
  ListGroupInvitesResult,
  GetMyGroupInviteForGroupResult,
  ListGroupMembersResult,
  SendGroupInviteMutation extends FunctionReference<'mutation'>,
  AcceptGroupInviteMutation extends FunctionReference<'mutation'>,
  DeclineGroupInviteMutation extends FunctionReference<'mutation'>,
  CancelGroupInviteMutation extends FunctionReference<'mutation'>,
  UpdateGroupInvitationPolicyMutation extends FunctionReference<'mutation'>,
>(
  api: GroupInvitationApi<
    ListMyGroupInvitesResult,
    ListGroupInvitesResult,
    GetMyGroupInviteForGroupResult,
    ListGroupMembersResult,
    SendGroupInviteMutation,
    AcceptGroupInviteMutation,
    DeclineGroupInviteMutation,
    CancelGroupInviteMutation,
    UpdateGroupInvitationPolicyMutation
  >,
  hooks: { useQuery: typeof useQuery; useMutation: typeof useMutation }
) {
  type Page = { numItems: number; cursor: string | null };
  type Status = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  function useMyGroupInvites(
    paginationOpts: Page = { numItems: 20, cursor: null },
    status?: Status
  ) {
    return hooks.useQuery(api.groupInvites.queries.listMyGroupInvites, {
      paginationOpts,
      ...(status ? { status } : {}),
    });
  }
  function useGroupInvites(
    groupId: ConvexId<'groups'>,
    paginationOpts: Page = { numItems: 20, cursor: null },
    status?: Status
  ) {
    return hooks.useQuery(api.groupInvites.queries.listGroupInvites, {
      groupId,
      paginationOpts,
      ...(status ? { status } : {}),
    });
  }
  function useMyGroupInviteForGroup(groupId: ConvexId<'groups'>) {
    return hooks.useQuery(api.groupInvites.queries.getMyGroupInviteForGroup, {
      groupId,
    });
  }
  function useGroupMembers(
    groupId: ConvexId<'groups'> | 'skip',
    paginationOpts: Page = { numItems: 20, cursor: null }
  ) {
    return hooks.useQuery(
      api.groups.queries.listGroupMembers,
      groupId === 'skip'
        ? 'skip'
        : {
            groupId,
            paginationOpts,
          }
    );
  }
  function useSendGroupInvite() {
    return hooks.useMutation<SendGroupInviteMutation>(
      api.groupInvites.mutations.sendGroupInvite
    );
  }
  function useAcceptGroupInvite() {
    return hooks.useMutation<AcceptGroupInviteMutation>(
      api.groupInvites.mutations.acceptGroupInvite
    );
  }
  function useDeclineGroupInvite() {
    return hooks.useMutation<DeclineGroupInviteMutation>(
      api.groupInvites.mutations.declineGroupInvite
    );
  }
  function useCancelGroupInvite() {
    return hooks.useMutation<CancelGroupInviteMutation>(
      api.groupInvites.mutations.cancelGroupInvite
    );
  }
  function useUpdateGroupInvitationPolicy() {
    return hooks.useMutation<UpdateGroupInvitationPolicyMutation>(
      api.groups.mutations.updateGroupInvitationPolicy
    );
  }
  return {
    useMyGroupInvites,
    useGroupInvites,
    useMyGroupInviteForGroup,
    useGroupMembers,
    useSendGroupInvite,
    useAcceptGroupInvite,
    useDeclineGroupInvite,
    useCancelGroupInvite,
    useUpdateGroupInvitationPolicy,
  };
}
