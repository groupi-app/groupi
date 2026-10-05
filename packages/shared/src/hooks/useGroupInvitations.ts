import type { useMutation, useQuery, ReactMutation } from 'convex/react';
import type { FunctionReference, FunctionReturnType } from 'convex/server';
import type { ConvexId } from './types';
interface GroupInvitationApi {
  groupInvites: {
    queries: {
      listMyGroupInvites: FunctionReference<'query'>;
      listGroupInvites: FunctionReference<'query'>;
      getMyGroupInviteForGroup: FunctionReference<'query'>;
    };
    mutations: {
      sendGroupInvite: FunctionReference<'mutation'>;
      acceptGroupInvite: FunctionReference<'mutation'>;
      declineGroupInvite: FunctionReference<'mutation'>;
      cancelGroupInvite: FunctionReference<'mutation'>;
    };
  };
  groups: {
    queries: { listGroupMembers: FunctionReference<'query'> };
    mutations: { updateGroupInvitationPolicy: FunctionReference<'mutation'> };
  };
}
/** Uses only the consuming app's SDK, preserving its provider identity. */
export function createGroupInvitationHooks<Api extends GroupInvitationApi>(
  api: Api,
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
    }) as
      | FunctionReturnType<Api['groupInvites']['queries']['listMyGroupInvites']>
      | undefined;
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
    }) as
      | FunctionReturnType<Api['groupInvites']['queries']['listGroupInvites']>
      | undefined;
  }
  function useMyGroupInviteForGroup(groupId: ConvexId<'groups'>) {
    return hooks.useQuery(api.groupInvites.queries.getMyGroupInviteForGroup, {
      groupId,
    }) as
      | FunctionReturnType<
          Api['groupInvites']['queries']['getMyGroupInviteForGroup']
        >
      | undefined;
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
    ) as
      | FunctionReturnType<Api['groups']['queries']['listGroupMembers']>
      | undefined;
  }
  function useSendGroupInvite() {
    return hooks.useMutation(
      api.groupInvites.mutations.sendGroupInvite
    ) as ReactMutation<Api['groupInvites']['mutations']['sendGroupInvite']>;
  }
  function useAcceptGroupInvite() {
    return hooks.useMutation(
      api.groupInvites.mutations.acceptGroupInvite
    ) as ReactMutation<Api['groupInvites']['mutations']['acceptGroupInvite']>;
  }
  function useDeclineGroupInvite() {
    return hooks.useMutation(
      api.groupInvites.mutations.declineGroupInvite
    ) as ReactMutation<Api['groupInvites']['mutations']['declineGroupInvite']>;
  }
  function useCancelGroupInvite() {
    return hooks.useMutation(
      api.groupInvites.mutations.cancelGroupInvite
    ) as ReactMutation<Api['groupInvites']['mutations']['cancelGroupInvite']>;
  }
  function useUpdateGroupInvitationPolicy() {
    return hooks.useMutation(
      api.groups.mutations.updateGroupInvitationPolicy
    ) as ReactMutation<
      Api['groups']['mutations']['updateGroupInvitationPolicy']
    >;
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
