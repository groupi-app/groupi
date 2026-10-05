import type {
  useQuery,
  useMutation,
  PaginatedQueryReference,
  UsePaginatedQueryReturnType,
} from 'convex/react';
import type { FunctionReference } from 'convex/server';
export function createAccountResolutionHooks<
  Api extends {
    users: { mutations: { deleteUserAccount: FunctionReference<'mutation'> } };
    accountResolution: {
      queries: {
        listOwned: PaginatedQueryReference;
        readiness: FunctionReference<'query'>;
        recipients: PaginatedQueryReference;
      };
      mutations: { deleteOwnedEvent: FunctionReference<'mutation'> };
    };
    groups: { mutations: { deleteGroup: FunctionReference<'mutation'> } };
    groupTransfers: {
      mutations: {
        offer: FunctionReference<'mutation'>;
        cancel: FunctionReference<'mutation'>;
      };
    };
    eventTransfers: {
      mutations: {
        offer: FunctionReference<'mutation'>;
        cancel: FunctionReference<'mutation'>;
      };
    };
  },
>(
  api: Api,
  hooks: {
    useQuery: typeof useQuery;
    useMutation: typeof useMutation;
    usePaginatedQuery: (
      query: Api['accountResolution']['queries']['listOwned'],
      args: { kind: 'GROUP' | 'EVENT' },
      options: { initialNumItems: number }
    ) => UsePaginatedQueryReturnType<
      Api['accountResolution']['queries']['listOwned']
    >;
    useRecipientPagination: (
      query: Api['accountResolution']['queries']['recipients'],
      args: { kind: 'GROUP' | 'EVENT'; id: string },
      options: { initialNumItems: number }
    ) => UsePaginatedQueryReturnType<
      Api['accountResolution']['queries']['recipients']
    >;
  }
) {
  function useAccountResponsibilities(kind: 'GROUP' | 'EVENT') {
    return hooks.usePaginatedQuery(
      api.accountResolution.queries.listOwned,
      { kind },
      { initialNumItems: 20 }
    );
  }
  function useAccountRecipients(kind: 'GROUP' | 'EVENT', id: string) {
    return hooks.useRecipientPagination(
      api.accountResolution.queries.recipients,
      { kind, id },
      { initialNumItems: 20 }
    );
  }
  function useAccountReadiness() {
    return hooks.useQuery<Api['accountResolution']['queries']['readiness']>(
      api.accountResolution.queries.readiness,
      {} as never
    );
  }
  function useAccountResolutionActions() {
    return {
      deleteAccount: hooks.useMutation<
        Api['users']['mutations']['deleteUserAccount']
      >(api.users.mutations.deleteUserAccount),
      deleteEvent: hooks.useMutation<
        Api['accountResolution']['mutations']['deleteOwnedEvent']
      >(api.accountResolution.mutations.deleteOwnedEvent),
      deleteGroup: hooks.useMutation<Api['groups']['mutations']['deleteGroup']>(
        api.groups.mutations.deleteGroup
      ),
      offerEvent: hooks.useMutation<
        Api['eventTransfers']['mutations']['offer']
      >(api.eventTransfers.mutations.offer),
      offerGroup: hooks.useMutation<
        Api['groupTransfers']['mutations']['offer']
      >(api.groupTransfers.mutations.offer),
      cancelEvent: hooks.useMutation<
        Api['eventTransfers']['mutations']['cancel']
      >(api.eventTransfers.mutations.cancel),
      cancelGroup: hooks.useMutation<
        Api['groupTransfers']['mutations']['cancel']
      >(api.groupTransfers.mutations.cancel),
    };
  }
  return {
    useAccountRecipients,
    useAccountResponsibilities,
    useAccountReadiness,
    useAccountResolutionActions,
  };
}
